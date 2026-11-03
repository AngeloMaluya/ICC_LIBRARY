import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import Sidebar from "../sidebar/sidebar.jsx";
import "./FullView.css";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// PDF.js worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function FullView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const pdfContainerRef = useRef(null);
  const pageRefs = useRef([]);

  const [research, setResearch] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState("");

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarked, setBookmarked] = useState(false);

  const pdfUrl = research?.pdf_url;
  const token = sessionStorage.getItem("authToken");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // LOAD RESEARCH AND RECOMMENDATIONS
  useEffect(() => {
    const controller = new AbortController();

    const fetchResearch = async () => {
      try {
        setLoading(true);
        setError("");
        setResearch(null);
        setRecommendations([]);
        setPageNumber(1);
        setNumPages(0);
        pageRefs.current = [];

        if (!token) {
          throw new Error(
            "Authentication required. Please log in again."
          );
        }

        const response = await fetch(
          `${API_URL}/api/research/${id}`,
          {
            headers: authHeaders,
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

        const currentResearch = data.research || data;

        setResearch(currentResearch);

        // LOAD RECOMMENDATIONS
        const recommendationResponse = await fetch(
          `${API_URL}/api/research`,
          {
            headers: authHeaders,
            signal: controller.signal,
          }
        );

        if (recommendationResponse.ok) {
          const recommendationData =
            await recommendationResponse.json();

          const researchList =
            recommendationData.research ||
            recommendationData.researches ||
            recommendationData;

          if (Array.isArray(researchList)) {
            setRecommendations(
              researchList.filter(
                (item) =>
                  String(item.id) !== String(id)
              )
            );
          }
        }
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error(
          "Full PDF loading error:",
          error
        );

        setError(
          error.message ||
            "Unable to load research."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResearch();

    return () => {
      controller.abort();
    };
  }, [API_URL, id]);

  // LOAD PDF USING JWT AUTHENTICATION
  useEffect(() => {
    if (!pdfUrl || !token) {
      setPdfBlobUrl(null);
      return;
    }

    const controller = new AbortController();
    let objectUrl = null;

    const fetchPdf = async () => {
      try {
        setLoadingPdf(true);
        setError("");
        setPdfBlobUrl(null);

        const response = await fetch(pdfUrl, {
          headers: authHeaders,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load PDF (${response.status}).`
          );
        }

        const blob = await response.blob();

        if (!blob.size) {
          throw new Error(
            "The PDF file is empty."
          );
        }

        objectUrl = URL.createObjectURL(blob);

        setPdfBlobUrl(objectUrl);
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error(
          "PDF FETCH ERROR:",
          error
        );

        setError(
          error.message ||
            "Unable to load PDF."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPdf(false);
        }
      }
    };

    fetchPdf();

    return () => {
      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [pdfUrl, token]);

  // CHECK PDF URL
  useEffect(() => {
    if (pdfUrl) {
      console.log("PDF URL:", pdfUrl);
    } else if (research) {
      console.error(
        "PDF URL is missing from the research record."
      );
    }
  }, [pdfUrl, research]);

  // LOAD SAVED BOOKMARK
  useEffect(() => {
    const savedBookmarks = JSON.parse(
      localStorage.getItem(
        "researchBookmarks"
      ) || "[]"
    );

    setBookmarked(
      savedBookmarks.some(
        (bookmark) =>
          String(bookmark) === String(id)
      )
    );
  }, [id]);

  // RECORD VIEWING HISTORY
  const recordViewingHistory = async () => {
    if (!token || !id) {
      return;
    }

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

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to record viewing history:",
          data
        );

        return;
      }

      console.log(
        "Viewing history recorded:",
        data
      );
    } catch (error) {
      console.error(
        "Viewing history error:",
        error
      );
    }
  };

  // PDF LOAD SUCCESS
  const onDocumentLoadSuccess = ({
    numPages,
  }) => {
    console.log(
      "PDF loaded successfully."
    );

    console.log(
      "Total pages:",
      numPages
    );

    setNumPages(numPages);
    setPageNumber(1);
    pageRefs.current = [];
    setError("");

    // ADD TO VIEWING HISTORY
    recordViewingHistory();

    if (pdfContainerRef.current) {
      pdfContainerRef.current.scrollTop = 0;
    }
  };

  // PDF LOAD ERROR
  const onDocumentLoadError = (error) => {
    console.error(
      "PDF LOAD ERROR:",
      error
    );

    setError(
      `PDF loading failed: ${error.message}`
    );
  };

  // PDF SOURCE ERROR
  const onDocumentSourceError = (error) => {
    console.error(
      "PDF SOURCE ERROR:",
      error
    );

    setError(
      `PDF source error: ${error.message}`
    );
  };

  // SCROLL TO PAGE
  const scrollToPage = (targetPage) => {
    const container =
      pdfContainerRef.current;

    const pageElement =
      pageRefs.current[targetPage - 1];

    if (!container || !pageElement) {
      return;
    }

    const containerRect =
      container.getBoundingClientRect();

    const pageRect =
      pageElement.getBoundingClientRect();

    container.scrollTo({
      top:
        container.scrollTop +
        pageRect.top -
        containerRect.top -
        10,

      behavior: "smooth",
    });

    setPageNumber(targetPage);
  };

  // PAGE NAVIGATION
  const changePage = (amount) => {
    const nextPage = Math.min(
      Math.max(
        pageNumber + amount,
        1
      ),
      numPages
    );

    scrollToPage(nextPage);
  };

  // UPDATE PAGE NUMBER WHILE SCROLLING
  const handlePdfScroll = () => {
    const container =
      pdfContainerRef.current;

    if (!container) return;

    const containerRect =
      container.getBoundingClientRect();

    const referencePosition =
      containerRect.top + 30;

    let visiblePage = 1;
    let smallestDistance = Infinity;

    pageRefs.current.forEach(
      (pageElement, index) => {
        if (!pageElement) return;

        const pageRect =
          pageElement.getBoundingClientRect();

        const distance = Math.abs(
          pageRect.top -
            referencePosition
        );

        if (
          distance <
          smallestDistance
        ) {
          smallestDistance = distance;
          visiblePage = index + 1;
        }
      }
    );

    setPageNumber((current) =>
      current === visiblePage
        ? current
        : visiblePage
    );
  };

  // BOOKMARK
  const toggleBookmark = () => {
    const savedBookmarks = JSON.parse(
      localStorage.getItem(
        "researchBookmarks"
      ) || "[]"
    );

    let updatedBookmarks;

    if (bookmarked) {
      updatedBookmarks =
        savedBookmarks.filter(
          (bookmark) =>
            String(bookmark) !==
            String(id)
        );
    } else {
      updatedBookmarks = [
        ...savedBookmarks,
        id,
      ];
    }

    localStorage.setItem(
      "researchBookmarks",
      JSON.stringify(
        updatedBookmarks
      )
    );

    setBookmarked(!bookmarked);
  };

  // OPEN ANOTHER RESEARCH
  const openResearch = (researchId) => {
    navigate(
      `/fullview/${researchId}`
    );
  };

  //pdf size
  useEffect(() => {
  const container = pdfContainerRef.current;

  if (!container) return;

  const updatePdfWidth = () => {
    const availableWidth = container.clientWidth - 24;
    setPdfWidth(Math.max(100, availableWidth));
  };

  updatePdfWidth();

  const observer = new ResizeObserver(updatePdfWidth);
  observer.observe(container);

  return () => observer.disconnect();
  }, []);


  return (
    <div className="full-view-page">
      <Sidebar />

      <main className="full-view-main">
        {/* HEADER */}
        <header className="full-view-header">
          <div className="full-view-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search research..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  searchTerm.trim()
                ) {
                  window.find(searchTerm);
                }
              }}
            />
          </div>
        </header>

        <div className="full-view-content">
          {/* RESEARCH INFORMATION */}
          <aside className="full-view-information">
            {loading ? (
              <p>
                Loading research...
              </p>
            ) : error && !research ? (
              <p>{error}</p>
            ) : research ? (
              <>
                <p className="full-view-stats">
                  {numPages > 0
                    ? `${numPages} pages`
                    : "Research document"}
                </p>

                <h1>
                  {research.title}
                </h1>

                <p>
                  <strong>
                    Author:
                  </strong>{" "}
                  {research.author ||
                    "Unknown Author"}
                </p>

                <p>
                  <strong>
                    Year:
                  </strong>{" "}
                  {research.year ||
                    "Unknown Year"}
                </p>

                <p>
                  <strong>
                    Program:
                  </strong>{" "}
                  {research.program ||
                    "Unknown Program"}
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

          {/* PDF TOOLBAR */}
          <section className="full-view-toolbar">
            <button
              type="button"
              title="Search in PDF"
              onClick={() =>
                setSearchOpen(
                  !searchOpen
                )
              }
            >
              ⌕
            </button>

            <button
              type="button"
              title="Help"
              onClick={() =>
                alert(
                  "Use the toolbar to navigate, bookmark, and zoom the PDF."
                )
              }
            >
              ♧
            </button>

            <div className="toolbar-divider" />

            <button
              type="button"
              title="Previous page"
              onClick={() =>
                changePage(-1)
              }
              disabled={
                pageNumber <= 1
              }
            >
              ⌃
            </button>

            <span className="toolbar-page-number">
              {pageNumber}
            </span>

            <button
              type="button"
              title="Next page"
              onClick={() =>
                changePage(1)
              }
              disabled={
                !numPages ||
                pageNumber >= numPages
              }
            >
              ⌄
            </button>

            <div className="toolbar-divider" />

            <button
              type="button"
              title={
                bookmarked
                  ? "Remove bookmark"
                  : "Bookmark research"
              }
              onClick={
                toggleBookmark
              }
            >
              {bookmarked
                ? "★"
                : "☆"}
            </button>

            <div className="toolbar-divider" />

            <button
              type="button"
              title="Zoom out"
              onClick={() =>
                setScale(
                  (current) =>
                    Math.max(
                      0.5,
                      current - 0.1
                    )
                )
              }
              disabled={scale <= 0.5}
            >
              ⊖
            </button>

            <span className="toolbar-zoom">
              {Math.round(
                scale * 100
              )}
              %
            </span>

            <button
              type="button"
              title="Zoom in"
              onClick={() =>
                setScale(
                  (current) =>
                    Math.min(
                      2,
                      current + 0.1
                    )
                )
              }
              disabled={scale >= 2}
            >
              ⊕
            </button>
          </section>

          {/* PDF DOCUMENT */}
          <section
            className="full-view-document"
            ref={pdfContainerRef}
            onScroll={
              handlePdfScroll
            }
          >
            {loading ||
            loadingPdf ? (
              <p>Loading PDF...</p>
            ) : error &&
              !research ? (
              <p>{error}</p>
            ) : !pdfUrl ? (
              <p>
                PDF file is not
                available.
              </p>
            ) : !pdfBlobUrl ? (
              <div className="pdf-error-message">
                <h3>
                  Unable to display
                  PDF
                </h3>

                <p>
                  {error ||
                    "PDF is not available."}
                </p>
              </div>
            ) : (
              <div className="pdf-document-wrapper">
                {searchOpen && (
                  <div className="pdf-search-panel">
                    <input
                      type="text"
                      placeholder="Find text in PDF..."
                      value={
                        searchTerm
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchTerm(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                            "Enter" &&
                          searchTerm.trim()
                        ) {
                          window.find(
                            searchTerm
                          );
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        window.find(
                          searchTerm
                        )
                      }
                    >
                      Find
                    </button>
                  </div>
                )}

                {error ? (
                  <div className="pdf-error-message">
                    <h3>
                      Unable to display
                      PDF
                    </h3>

                    <p>{error}</p>

                    <button
                      type="button"
                      onClick={
                        openPdfInNewTab
                      }
                    >
                      Open PDF directly
                    </button>
                  </div>
                ) : (
                  <Document
                    file={pdfBlobUrl}
                    onLoadSuccess={
                      onDocumentLoadSuccess
                    }
                    onLoadError={
                      onDocumentLoadError
                    }
                    onSourceError={
                      onDocumentSourceError
                    }
                    loading={
                      <p>
                        Loading PDF
                        document...
                      </p>
                    }
                    error={
                      <p>
                        Unable to display
                        this PDF document.
                      </p>
                    }
                    className="pdf-document"
                  >
                    {Array.from(
                      {
                        length:
                          numPages,
                      },
                      (_, index) => (
                        <div
                          className="pdf-page"
                          key={`page_${
                            index + 1
                          }`}
                          ref={(
                            element
                          ) => {
                            pageRefs.current[
                              index
                            ] =
                              element;
                          }}
                        >
                        <Page
                          pageNumber={index + 1}
                          width={pdfWidth ? Math.min(pdfWidth, 750) : undefined}
                          scale={scale}
                          renderTextLayer={false}
                          renderAnnotationLayer={true}
                        />
                        </div>
                      )
                    )}
                  </Document>
                )}
              </div>
            )}
          </section>

          {/* RECOMMENDATIONS */}
          <aside className="full-view-recommendations">
            <h3>
              You might also like
            </h3>

            {recommendations.map(
              (item) => (
                <button
                  type="button"
                  className="recommendation-item"
                  key={item.id}
                  onClick={() =>
                    openResearch(
                      item.id
                    )
                  }
                >
                  <div className="recommendation-thumbnail">
                    <span>
                      PDF
                    </span>
                  </div>

                  <div className="recommendation-details">
                    <strong>
                      {item.title}
                    </strong>

                    <small>
                      {item.author ||
                        "Unknown Author"}
                    </small>

                    <small>
                      {item.year ||
                        "Unknown Year"}
                    </small>
                  </div>
                </button>
              )
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}