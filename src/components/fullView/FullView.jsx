import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

import "./FullView.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Escape PDF text before inserting safe highlight markup.
function escapePdfHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;",
  })[character]);
}

function highlightPdfText(text, keyword) {
  if (!keyword) return escapePdfHtml(text);
  const source = String(text);
  const lower = source.toLocaleLowerCase();
  const needle = keyword.toLocaleLowerCase();
  let result = "";
  let start = 0;
  while (start < source.length) {
    const index = lower.indexOf(needle, start);
    if (index < 0) break;
    result += escapePdfHtml(source.slice(start, index));
    result += `<mark class="pdf-highlight">${escapePdfHtml(source.slice(index, index + needle.length))}</mark>`;
    start = index + needle.length;
  }
  return result + escapePdfHtml(source.slice(start));
}

// Render PDF pages only when they are near the visible area
function LazyPdfPage({ number, width, scale, scrollRoot, setPageRef, activePdfQuery }) {
  
  const elementRef = useRef(null);
  const [nearViewport, setNearViewport] = useState(number === 1);
  const [aspectRatio, setAspectRatio] = useState(1.414);
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !scrollRoot) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(entry.isIntersecting),
      { root: scrollRoot, rootMargin: "900px 0px", threshold: 0 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [scrollRoot]);

  // Store the reference of each PDF page
  const setRef = useCallback(
    (element) => {
      elementRef.current = element;
      setPageRef(number - 1, element);
    },
    [number, setPageRef]
  );

  const estimatedHeight = Math.max(
    100,
    width * scale * aspectRatio
  );

  return (
    <div
      ref={setRef}
      className="pdf-page"
      style={{
        minHeight: estimatedHeight,
        width: width * scale,
        maxWidth: "none",
      }}
    >
      {nearViewport && (
        <Page
          pageNumber={number}
          width={width}
          scale={scale}
          renderTextLayer={true}
          customTextRenderer={({ str }) => highlightPdfText(str, activePdfQuery)}
          renderAnnotationLayer={false}
          onLoadSuccess={(page) => {
            const viewport = page.getViewport({ scale: 1 });

            if (viewport.width) {
              setAspectRatio(viewport.height / viewport.width);
            }
          }}
          loading={<div style={{ height: estimatedHeight }} />}
        />
      )}
    </div>
  );
}

export default function FullView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  // Identify the current role to keep student features separate.
  let storedUser = null;
  try {
    storedUser = JSON.parse(sessionStorage.getItem("libraryUser") || "null");
  } catch {
    storedUser = null;
  }
  const isAdmin = storedUser?.role === "admin";

  const pdfContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const recordedIdRef = useRef(null);

  // Reading progress is saved per authenticated student and research paper.
  const [readingProgress, setReadingProgress] = useState(null);
  const [resumeReady, setResumeReady] = useState(false);
  const resumeReadyRef = useRef(false);
  const lastSavedPageRef = useRef(null);
  const latestPageRef = useRef(1);


  // Research and recommendation states
  const [research, setResearch] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] =
    useState(true);

  // PDF viewer states
  const [error, setError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(0);
  const [scrollRoot, setScrollRoot] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Search research records (top search bar)
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const [librarySearchResults, setLibrarySearchResults] = useState([]);
  const [librarySearchLoading, setLibrarySearchLoading] = useState(false);

  // Search text inside the currently opened PDF
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [activePdfQuery, setActivePdfQuery] = useState("");


  const pdfDocumentRef = useRef(null);
  const searchRequestRef = useRef(0);
  const highlightScrollRequestRef = useRef(0);

  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [searchingPdf, setSearchingPdf] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);

  // Bookmark and notification states
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkNotification, setBookmarkNotification] = useState("");
  const [bookmarkUpdating, setBookmarkUpdating] = useState(false);

  const pdfUrl = research?.pdf_url;
  const token = sessionStorage.getItem("authToken");

  // Popularity and semantic recommendations
  const [mostViewed, setMostViewed] = useState([]);
  const [loadingMostViewed, setLoadingMostViewed] = useState(true);

useEffect(() => {
  if (!id || !token) return;

  const controller = new AbortController();

  const fetchRecommendations = async () => {
    setLoadingMostViewed(true);
    setLoadingRecommendations(true);
    setMostViewed([]);
    setRecommendations([]);

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [popularResult, relatedResult] =
      await Promise.allSettled([
        fetch(`${API_URL}/api/research/most-viewed`, {
          headers,
          signal: controller.signal,
        }).then(async (response) => {
          if (!response.ok) throw new Error("Most viewed request failed");
          return response.json();
        }),

        fetch(`${API_URL}/api/research/${id}/related`, {
          headers,
          signal: controller.signal,
        }).then(async (response) => {
          if (!response.ok) throw new Error("Related research request failed");
          return response.json();
        }),
      ]);

    if (controller.signal.aborted) return;

    if (popularResult.status === "fulfilled") {
      setMostViewed(
        (popularResult.value.researches || []).filter(
          (item) => String(item.id) !== String(id)
        )
      );
    } else {
      console.error("MOST VIEWED ERROR:", popularResult.reason);
    }

    if (relatedResult.status === "fulfilled") {
      setRecommendations(
        relatedResult.value.recommendations || []
      );
    } else {
      console.error("RELATED RESEARCH ERROR:", relatedResult.reason);
    }

    setLoadingMostViewed(false);
    setLoadingRecommendations(false);
  };

  fetchRecommendations();

  return () => controller.abort();
}, [API_URL, id, token]);


  // Store the rendered PDF page references
  const setPageRef = useCallback((index, element) => {
    pageRefs.current[index] = element;
  }, []);

  // Load the saved page before allowing progress updates.
  useEffect(() => {
    const controller = new AbortController();
    resumeReadyRef.current = false;
    setResumeReady(false);
    setReadingProgress(null);
    lastSavedPageRef.current = null;
    latestPageRef.current = 1;

    const loadReadingProgress = async () => {
      if (!id || !token || isAdmin) {
        if (!controller.signal.aborted) {
          setReadingProgress({ researchId: String(id), page: 1 });
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/reading-progress/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Unable to load reading progress (HTTP ${response.status})`);
        }

        const data = await response.json();
        if (controller.signal.aborted) return;

        const page = Number(data.lastPage);
        setReadingProgress({
          researchId: String(id),
          page: Number.isSafeInteger(page) && page > 0 ? page : 1,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("READING PROGRESS LOAD ERROR:", error);
        // Do not overwrite stored progress if the GET request failed.
        // The PDF remains readable, but saving is disabled for this visit.
      }
    };

    loadReadingProgress();
    return () => controller.abort();
  }, [API_URL, id, token, isAdmin]);

  // Load only the active research. Recommendations have their own request above.
  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setResearch(null);
    setError("");
    setPdfError("");
    setNumPages(0);
    setPageNumber(1);
    resumeReadyRef.current = false;
    setResumeReady(false);
    pageRefs.current = [];
    pdfDocumentRef.current = null;
    searchRequestRef.current += 1;
    highlightScrollRequestRef.current += 1;
    setPdfSearchTerm("");
    setActivePdfQuery("");
    setSearchMatches([]);
    setSearchCompleted(false);
    setSearchingPdf(false);
    setCurrentMatchIndex(0);
    recordedIdRef.current = null;

    if (!token) {
      setError("Authentication required. Please log in again.");
      setLoading(false);
      return () => controller.abort();
    }

    const loadResearch = async () => {
      try {
        const response = await fetch(`${API_URL}/api/research/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Unable to load research.");

        const data = await response.json();
        if (!controller.signal.aborted) {
          setResearch(data.research || data);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("FULLVIEW FETCH ERROR:", error);
        setError(error.message || "Unable to load research.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadResearch();
    return () => controller.abort();
  }, [API_URL, id, token]);

  // Adjust the PDF width to fit its container
  useEffect(() => {
    const container = pdfContainerRef.current;

    if (!container) return;

    setScrollRoot(container);

    const updateWidth = () => {
      setPdfWidth(
        Math.min(
          750,
          Math.max(100, container.clientWidth - 24)
        )
      );
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Check whether the current research is bookmarked
  useEffect(() => {
    const controller = new AbortController();

    async function checkBookmark() {
      try {
        setBookmarked(false);

        // Administrators do not use student bookmarks.
        if (!token || !id || isAdmin) return;

        const response = await fetch(
          `${API_URL}/api/saved/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to check bookmark.");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setBookmarked(data.bookmarked);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("BOOKMARK CHECK ERROR:", error);
        }
      }
    }

    checkBookmark();

    return () => controller.abort();
  }, [API_URL, id, token, isAdmin]);

  // Record the research in the student's viewing history
  const recordViewingHistory = useCallback(async () => {
    if (
      !token ||
      !id ||
      isAdmin ||
      recordedIdRef.current === String(id)
    ) {
      return;
    }

    recordedIdRef.current = String(id);

    try {
      const response = await fetch(
        `${API_URL}/api/history/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        console.error(
          "Failed to record viewing history:",
          data
        );

        recordedIdRef.current = null;
      }
    } catch (err) {
      console.error("Viewing history error:", err);
      recordedIdRef.current = null;
    }
  }, [API_URL, id, token, isAdmin]);

  // Update the PDF viewer when the document finishes loading
  const onDocumentLoadSuccess = (pdf) => {
    pdfDocumentRef.current = pdf;

    setNumPages(pdf.numPages);
    setPdfError("");

    // Reset search when opening a PDF
    searchRequestRef.current += 1;
    setSearchMatches([]);
    setCurrentMatchIndex(0);
    setSearchingPdf(false);
    setSearchCompleted(false);
    setActivePdfQuery("");

    if (pdfContainerRef.current) {
      pdfContainerRef.current.scrollTop = 0;
    }

    recordViewingHistory();
  };

  // Restore the page only after the PDF's page placeholders exist.
  // Scroll events and autosaves remain disabled until restoration finishes.
  useEffect(() => {
    if (
      !numPages ||
      !pdfWidth ||
      readingProgress?.researchId !== String(id)
    ) return;

    // Restore only once per document, not again on resize or zoom.
    if (resumeReadyRef.current) return;

    const targetPage = Math.min(
      numPages,
      Math.max(1, readingProgress.page)
    );
    let frameId;
    let attempts = 0;
    let cancelled = false;

    const restore = () => {
      if (cancelled) return;
      const container = pdfContainerRef.current;
      const target = pageRefs.current[targetPage - 1];

      if (container && target) {
        container.scrollTop +=
          target.getBoundingClientRect().top -
          container.getBoundingClientRect().top - 10;
        latestPageRef.current = targetPage;
        lastSavedPageRef.current = targetPage;
        setPageNumber(targetPage);
        resumeReadyRef.current = true;
        setResumeReady(true);
        return;
      }

      if (++attempts < 180) {
        frameId = requestAnimationFrame(restore);
      } else {
        console.error("Unable to locate the saved PDF page.");
      }
    };

    frameId = requestAnimationFrame(restore);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [id, numPages, pdfWidth, readingProgress]);

  // Debounce page saves so scrolling doesn't create excessive API calls.
  useEffect(() => {
    if (!resumeReady || !token || !id || isAdmin || !numPages) return;
    if (lastSavedPageRef.current === pageNumber) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/reading-progress/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ page: pageNumber }),
            signal: controller.signal,
          }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        lastSavedPageRef.current = pageNumber;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("READING PROGRESS SAVE ERROR:", error);
        }
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [API_URL, id, token, isAdmin, pageNumber, resumeReady, numPages]);

  // Flush the latest page when leaving the viewer or changing research.
  // keepalive allows the request to continue during page navigation.
  useEffect(() => {
    if (!id || !token || isAdmin) return;
    return () => {
      if (!resumeReadyRef.current) return;
      const page = latestPageRef.current;
      if (page === lastSavedPageRef.current) return;
      fetch(`${API_URL}/api/reading-progress/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ page }),
        keepalive: true,
      }).catch((error) => console.error("READING PROGRESS FLUSH ERROR:", error));
    };
  }, [API_URL, id, token, isAdmin]);

  // Scroll to the selected PDF page
  const scrollToPage = (targetPage) => {
    const container = pdfContainerRef.current;
    const page = pageRefs.current[targetPage - 1];

    if (!container || !page) return;

    const offset =
      page.getBoundingClientRect().top -
      container.getBoundingClientRect().top;

    container.scrollTo({
      top: container.scrollTop + offset - 10,
      behavior: "smooth",
    });

    latestPageRef.current = targetPage;
    setPageNumber(targetPage);
  };
  

  // Scroll to a matching highlight once its lazy-loaded page has rendered.
  const scrollToPdfMatch = (match, allMatches) => {
    scrollToPage(match.page);
    const request = ++highlightScrollRequestRef.current;
    const samePageIndex = allMatches
      .slice(0, allMatches.indexOf(match))
      .filter((item) => item.page === match.page).length;
    let attempts = 0;
    const findHighlight = () => {
      if (request !== highlightScrollRequestRef.current) return;
      const page = pageRefs.current[match.page - 1];
      const marks = page?.querySelectorAll(".pdf-highlight");
      if (marks?.length) {
        const target = marks[Math.min(samePageIndex, marks.length - 1)];
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      } else if (++attempts < 90) {
        requestAnimationFrame(findHighlight);
      }
    };
    requestAnimationFrame(findHighlight);
  };

  // Extract text directly from every page of the opened PDF.
  const searchInsidePdf = async () => {
    const pdf = pdfDocumentRef.current;
    const keyword = pdfSearchTerm.trim().toLocaleLowerCase();
    const requestId = ++searchRequestRef.current;
    if (!pdf || !keyword) {
      setActivePdfQuery("");
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      setSearchCompleted(false);
      return;
    }

    setSearchingPdf(true);
    setSearchCompleted(false);
    setSearchMatches([]);
    setCurrentMatchIndex(0);
    setActivePdfQuery("");
    try {
      const matches = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        // Space between items supports multiword search across text chunks.
        const text = content.items.map((item) => item.str || "").join(" ").toLocaleLowerCase();
        let from = 0;
        while (true) {
          const index = text.indexOf(keyword, from);
          if (index === -1) break;
          matches.push({ page: pageNumber, position: index });
          from = index + Math.max(keyword.length, 1);
        }
        if (requestId !== searchRequestRef.current) return;
      }
      if (requestId !== searchRequestRef.current) return;
      setSearchMatches(matches);
      setCurrentMatchIndex(0);
      setSearchCompleted(true);
      setActivePdfQuery(keyword);
      if (matches.length) {
        // Wait for the text layer to reflect the active query.
        requestAnimationFrame(() => scrollToPdfMatch(matches[0], matches));
      }
    } catch (err) {
      if (requestId !== searchRequestRef.current) return;
      console.error("PDF SEARCH ERROR:", err);
      setSearchCompleted(false);
      setActivePdfQuery("");
    } finally {
      if (requestId === searchRequestRef.current) setSearchingPdf(false);
    }
  };

  const navigateSearchMatch = (direction) => {
    if (!searchMatches.length) return;
    const index = (currentMatchIndex + direction + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(index);
    scrollToPdfMatch(searchMatches[index], searchMatches);
  };

  // Move forward or backward through the PDF pages
  const changePage = (amount) => {
    if (!numPages) return;

    scrollToPage(
      Math.min(
        numPages,
        Math.max(1, pageNumber + amount)
      )
    );
  };

  // Update the current page number while scrolling
  const handlePdfScroll = () => {
    const container = pdfContainerRef.current;

    if (!container || !numPages || !resumeReadyRef.current) return;

    const top =
      container.getBoundingClientRect().top + 30;

    let nearest = 1;
    let shortest = Infinity;

    pageRefs.current.forEach((element, index) => {
      if (!element) return;

      const distance = Math.abs(
        element.getBoundingClientRect().top - top
      );

      if (distance < shortest) {
        shortest = distance;
        nearest = index + 1;
      }
    });

    latestPageRef.current = nearest;
    setPageNumber((previous) =>
      previous === nearest ? previous : nearest
    );
  };

  // Save or remove the research bookmark in Supabase
  const toggleBookmark = async () => {
    // Block bookmark updates for administrators.
    if (bookmarkUpdating || isAdmin) return;

    try {
      setBookmarkUpdating(true);

      const currentToken =
        sessionStorage.getItem("authToken");

      if (!currentToken) {
        setBookmarkNotification("Please log in again.");
        return;
      }

      // Send the bookmark request to the backend
      const response = await fetch(
        `${API_URL}/api/saved/${id}`,
        {
          method: bookmarked ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update bookmark."
        );
      }

      // Update the bookmark icon
      setBookmarked(data.bookmarked);

      // Display the success notification
      setBookmarkNotification(
        data.bookmarked
          ? "Research PDF successfully saved to your bookmarks!"
          : "Research PDF successfully removed from your bookmarks."
      );
    } catch (error) {
      console.error("BOOKMARK ERROR:", error);

      // Display the error notification
      setBookmarkNotification(
        error.message ||
          "Failed to update bookmark. Please try again."
      );
    } finally {
      setBookmarkUpdating(false);
    }
  };

  // Open recommended research using the correct role layout
const openResearch = (researchId) => {
  navigate(
    isAdmin
      ? `/admin/fullview/${researchId}`
      : `/fullview/${researchId}`
  );
};

  // Open the PDF directly in a new browser tab
  const openPdfInNewTab = () => {
    if (pdfUrl) {
      window.open(
        pdfUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };


  // Search research records for the top dropdown
  useEffect(() => {
    const keyword = librarySearchTerm.trim();

    if (!keyword) {
      setLibrarySearchResults([]);
      setLibrarySearchLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLibrarySearchLoading(true);

        const params = new URLSearchParams({
          search: keyword,
        });

        const endpoint = isAdmin
          ? `${API_URL}/api/research/admin-list`
          : `${API_URL}/api/research?${params.toString()}`;

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to search research.");
        }

        const data = await response.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.researches)
          ? data.researches
          : [];

        // Match research information, not PDF text
        const term = keyword.toLowerCase();

        const matches = list.filter((item) =>
          [
            item.title,
            item.author,
            item.program,
            item.year,
          ].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(term)
          )
        );

        if (!controller.signal.aborted) {
          setLibrarySearchResults(matches.slice(0, 8));
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("LIBRARY SEARCH ERROR:", error);
          setLibrarySearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLibrarySearchLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [librarySearchTerm, API_URL, token, isAdmin]);

  return (
    <div className="full-view-page">
      <main className="full-view-main">
          <header className="full-view-header">
            <div className="full-view-search-wrapper">
              <div className="full-view-search">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search research..."
                  value={librarySearchTerm}
                  onChange={(event) =>
                    setLibrarySearchTerm(event.target.value)
                  }
                />
              </div>

              {librarySearchTerm.trim() && (
                <div className="full-view-search-dropdown">
                  {librarySearchLoading ? (
                    <p>Searching research...</p>
                  ) : librarySearchResults.length === 0 ? (
                    <p>No matching research found.</p>
                  ) : (
                    librarySearchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="full-view-search-result"
                        onClick={() => {
                          setLibrarySearchTerm("");
                          setLibrarySearchResults([]);
                          openResearch(item.id);
                        }}
                      >
                        <strong>{item.title}</strong>
                        <small>
                          {item.author || "Unknown Author"} •{" "}
                          {item.program || "Unknown Program"}
                        </small>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </header>


        <div className="full-view-content">
          {/* Research information panel */}
          <aside className="full-view-information">
            {loading ? (
              <p>Loading research...</p>
            ) : error ? (
              <p>{error}</p>
            ) : research ? (
              <>
                <p className="full-view-stats">
                  {numPages > 0
                    ? `${numPages} pages`
                    : "Research document"}
                </p>

                <h1>{research.title}</h1>

                <p>
                  <strong>Author:</strong>{" "}
                  {research.author || "Unknown Author"}
                </p>

                <p>
                  <strong>Year:</strong>{" "}
                  {research.year || "Unknown Year"}
                </p>

                <p>
                  <strong>Program:</strong>{" "}
                  {research.program || "Unknown Program"}
                </p>

                <div className="full-view-description">
                  <p>
                    {research.summary ||
                      "No description available."}
                  </p>
                </div>
              </>
            ) : null}
          </aside>

          {/* PDF navigation and bookmark toolbar */}
          <section className="full-view-toolbar">
            <button
              type="button"
              title="Search in PDF"
              onClick={() =>
                setSearchOpen((value) => !value)
              }
            >
              ⌕
            </button>

            <div className="toolbar-divider" />

            <button
              type="button"
              title="Previous page"
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
            >
              ⌃
            </button>

            <span className="toolbar-page-number">
              {pageNumber}
            </span>

            <button
              type="button"
              title="Next page"
              onClick={() => changePage(1)}
              disabled={
                !numPages || pageNumber >= numPages
              }
            >
              ⌄
            </button>

            <div className="toolbar-divider" />

            {/* Student-only bookmark control */}
            {!isAdmin && (
              <>
                <button
                  type="button"
                  title={bookmarked ? "Remove bookmark" : "Bookmark research"}
                  onClick={toggleBookmark}
                  disabled={bookmarkUpdating}
                >
                  {bookmarked ? "★" : "☆"}
                </button>
                <div className="toolbar-divider" />
              </>
            )}

            <button
              type="button"
              title="Zoom out"
              onClick={() =>
                setScale((value) =>
                  Math.max(
                    0.5,
                    Math.round((value - 0.1) * 10) / 10
                  )
                )
              }
              disabled={scale <= 0.5}
            >
              ⊖
            </button>

            <span className="toolbar-zoom">
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              title="Zoom in"
              onClick={() =>
                setScale((value) =>
                  Math.min(
                    2,
                    Math.round((value + 0.1) * 10) / 10
                  )
                )
              }
              disabled={scale >= 2}
            >
              ⊕
            </button>
          </section>

          {/* PDF document viewer */}
          {/* PDF search overlays the viewer; only the document below it scrolls. */}
          <div className="pdf-viewer-area">
            {searchOpen && (
              <div className="pdf-search-panel" role="search" aria-label="Search within PDF">
                <input
                  type="text"
                  placeholder="Find text in PDF..."
                  aria-label="Find text in PDF"
                  value={pdfSearchTerm}
                  onChange={(event) => {
                    setPdfSearchTerm(event.target.value);
                    searchRequestRef.current += 1;
                    highlightScrollRequestRef.current += 1;
                    setActivePdfQuery("");
                    setSearchMatches([]);
                    setCurrentMatchIndex(0);
                    setSearchingPdf(false);
                    setSearchCompleted(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchInsidePdf();
                  }}
                />
                <button type="button" onClick={searchInsidePdf} disabled={searchingPdf || !pdfSearchTerm.trim() || !pdfDocumentRef.current}>
                  {searchingPdf ? "Searching..." : "Find"}
                </button>
                {searchCompleted && (
                  <span className="pdf-search-count">
                    {searchMatches.length ? `${currentMatchIndex + 1} of ${searchMatches.length}` : "No matches"}
                  </span>
                )}
                {searchMatches.length > 0 && (
                  <>
                    <button type="button" onClick={() => navigateSearchMatch(-1)} title="Previous match">↑</button>
                    <button type="button" onClick={() => navigateSearchMatch(1)} title="Next match">↓</button>
                  </>
                )}
              </div>
            )}
          <section
            className="full-view-document"
            ref={pdfContainerRef}
            onScroll={handlePdfScroll}
          >
            {loading ? (
              <p>Loading research...</p>
            ) : error ? (
              <p>{error}</p>
            ) : !pdfUrl ? (
              <p>PDF file is not available.</p>
            ) : (
              <div className="pdf-document-wrapper">                
                {pdfError ? (
                  <div className="pdf-error-message">
                    <h3>Unable to display PDF</h3>
                    <p>{pdfError}</p>

                    <button
                      type="button"
                      onClick={openPdfInNewTab}
                    >
                      Open PDF directly
                    </button>
                  </div>
                ) : (
                  <Document
                    key={id}
                    file={pdfUrl}
                    onLoadSuccess={
                      onDocumentLoadSuccess
                    }
                    onLoadError={(err) =>
                      setPdfError(
                        `PDF loading failed: ${err.message}`
                      )
                    }
                    onSourceError={(err) =>
                      setPdfError(
                        `PDF source error: ${err.message}`
                      )
                    }
                    loading={
                      <p>Loading PDF document...</p>
                    }
                    error={
                      <p>
                        Unable to display this PDF document.
                      </p>
                    }
                    className="pdf-document"
                  >
                    {pdfWidth > 0 &&
                      Array.from(
                        { length: numPages },
                        (_, index) => (
                          <LazyPdfPage
                            key={`${id}-${index + 1}`}
                            number={index + 1}
                            width={pdfWidth}
                            scale={scale}
                            scrollRoot={scrollRoot}
                            setPageRef={setPageRef}
                            activePdfQuery={activePdfQuery}
                          />
                        )
                      )}
                  </Document>
                )}
              </div>
            )}
          </section>
          </div>

          {/* Recommended research papers */}

          <aside className="full-view-recommendations">

            <h3>Most Viewed Research</h3>

            {loadingMostViewed ? (
              <p>Loading popular research...</p>
            ) : mostViewed.length === 0 ? (
              <p>No popular research available.</p>
            ) : (
              mostViewed.map((item) => (
                <button
                  type="button"
                  className="recommendation-item"
                  key={`popular-${item.id}`}
                  onClick={() => openResearch(item.id)}
                >
                  <div className="recommendation-thumbnail">
                    <span>PDF</span>
                  </div>

                  <div className="recommendation-details">
                    <strong>{item.title}</strong>
                    <small>{item.author || "Unknown Author"}</small>
                    <small>{item.view_count} views</small>
                  </div>
                </button>
              ))
            )}

            <hr />

            <h3>Related Research</h3>

            {loadingRecommendations ? (
              <p>Finding related research...</p>
            ) : recommendations.length === 0 ? (
              <p>No semantically related research found.</p>
            ) : (
              recommendations.map((item) => (
                <button
                  type="button"
                  className="recommendation-item"
                  key={`related-${item.id}`}
                  onClick={() => openResearch(item.id)}
                >
                  <div className="recommendation-thumbnail">
                    <span>PDF</span>
                  </div>

                  <div className="recommendation-details">
                    <strong>{item.title}</strong>
                    <small>{item.author || "Unknown Author"}</small>
                    <small>{item.program || "Unknown Program"}</small>
                  </div>
                </button>
              ))
            )}

          </aside>

        </div>
      </main>

      {/* Bookmark notification modal */}
      {bookmarkNotification && (
        <div className="bookmark-overlay">
          <div
            className="bookmark-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bookmark-notification-title"
          >
            {/* Notification heading */}
            <h3 id="bookmark-notification-title">
              Bookmark Notification
            </h3>

            {/* Notification message */}
            <p>{bookmarkNotification}</p>

            {/* Close notification button */}
            <div className="bookmark-modal-actions">
              <button
                type="button"
                onClick={() =>
                  setBookmarkNotification("")
                }
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}