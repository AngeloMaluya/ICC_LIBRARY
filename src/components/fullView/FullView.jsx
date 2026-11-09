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

// Render PDF pages only when they are near the visible area
function LazyPdfPage({ number, width, scale, scrollRoot, setPageRef }) {
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
          renderTextLayer={false}
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
  const [searchTerm, setSearchTerm] = useState("");

  // Bookmark and notification states
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkNotification, setBookmarkNotification] = useState("");
  const [bookmarkUpdating, setBookmarkUpdating] = useState(false);

  const pdfUrl = research?.pdf_url;
  const token = sessionStorage.getItem("authToken");

  // Store the rendered PDF page references
  const setPageRef = useCallback((index, element) => {
    pageRefs.current[index] = element;
  }, []);

  // Fetch research details and recommendations
  useEffect(() => {
    const controller = new AbortController();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    setLoading(true);
    setLoadingRecommendations(true);
    setResearch(null);
    setRecommendations([]);
    setError("");
    setPdfError("");
    setNumPages(0);
    setPageNumber(1);

    pageRefs.current = [];
    recordedIdRef.current = null;

    if (!token) {
      setError("Authentication required. Please log in again.");
      setLoading(false);
      setLoadingRecommendations(false);

      return () => controller.abort();
    }

    // Load the selected research paper
    async function loadResearch() {
      try {
        const response = await fetch(
          `${API_URL}/api/research/${id}`,
          {
            headers,
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Unable to load research (${response.status}).`
          );
        }

        if (!controller.signal.aborted) {
          setResearch(data.research || data);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Research loading error:", err);
          setError(err.message || "Unable to load research.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    // Load recommended research papers
    async function loadRecommendations() {
      try {
        const response = await fetch(`${API_URL}/api/research`, {
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Recommendations request failed (${response.status})`
          );
        }

        const data = await response.json();
        const list =
          data.research || data.researches || data;

        if (
          !controller.signal.aborted &&
          Array.isArray(list)
        ) {
          setRecommendations(
            list.filter(
              (item) => String(item.id) !== String(id)
            )
          );
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Recommendations error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRecommendations(false);
        }
      }
    }

    loadResearch();
    loadRecommendations();

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
  const onDocumentLoadSuccess = ({ numPages: total }) => {
    setNumPages(total);
    setPageNumber(1);
    setPdfError("");

    if (pdfContainerRef.current) {
      pdfContainerRef.current.scrollTop = 0;
    }

    recordViewingHistory();
  };

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

    setPageNumber(targetPage);
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

    if (!container || !numPages) return;

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

  // Open another research paper
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

  return (
    <div className="full-view-page">
      <main className="full-view-main">
        {/* Research search bar */}
        <header className="full-view-header">
          <div className="full-view-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search research..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  searchTerm.trim()
                ) {
                  window.find?.(searchTerm);
                }
              }}
            />
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

            <button
              type="button"
              title="Help"
              onClick={() =>
                alert(
                  isAdmin
                    ? "Use the toolbar to navigate and zoom the PDF."
                    : "Use the toolbar to navigate, bookmark, and zoom the PDF."
                )
              }
            >
              ♧
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
                {/* Search inside the PDF */}
                {searchOpen && (
                  <div className="pdf-search-panel">
                    <input
                      type="text"
                      placeholder="Find text in PDF..."
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          searchTerm.trim()
                        ) {
                          window.find?.(searchTerm);
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        window.find?.(searchTerm)
                      }
                    >
                      Find
                    </button>
                  </div>
                )}

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
                          />
                        )
                      )}
                  </Document>
                )}
              </div>
            )}
          </section>

          {/* Recommended research papers */}
          <aside className="full-view-recommendations">
            <h3>You might also like</h3>

            {loadingRecommendations && (
              <p>Loading recommendations...</p>
            )}

            {!loadingRecommendations &&
              recommendations.map((item) => (
                <button
                  type="button"
                  className="recommendation-item"
                  key={item.id}
                  onClick={() =>
                    openResearch(item.id)
                  }
                >
                  <div className="recommendation-thumbnail">
                    <span>PDF</span>
                  </div>

                  <div className="recommendation-details">
                    <strong>{item.title}</strong>
                    <small>
                      {item.author || "Unknown Author"}
                    </small>
                    <small>
                      {item.year || "Unknown Year"}
                    </small>
                  </div>
                </button>
              ))}
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