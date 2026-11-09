
import { useEffect, useState } from "react";
import "./researchpopup.css";

const ResearchPopups = ({
  showPopup,
  selectedResearch,
  loadingResearch,
  closePopup,
  unknownProgramLabel = "Unknown Program",
  onReadFullResearch,
}) => {
  const API_URL = import.meta.env.VITE_API_URL;

  // Track the bookmark status and loading state
  const [bookmarked, setBookmarked] = useState(false);
  const [checkingBookmark, setCheckingBookmark] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [bookmarkError, setBookmarkError] = useState("");

  const researchId = selectedResearch?.id;

  // Check Supabase whenever a research popup opens
  useEffect(() => {
    if (!showPopup || !researchId) return;

    const controller = new AbortController();
    const token = sessionStorage.getItem("authToken");

    setBookmarked(false);
    setCheckingBookmark(true);
    setBookmarkError("");

    const checkBookmark = async () => {
      try {
        if (!token) {
          throw new Error("Please log in again.");
        }

        const response = await fetch(
          `${API_URL}/api/saved/${researchId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Unable to check bookmark.");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setBookmarked(Boolean(data.bookmarked));
        }
      } catch (error) {
        if (error.name !== "AbortError" && !controller.signal.aborted) {
          setBookmarkError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCheckingBookmark(false);
        }
      }
    };

    checkBookmark();

    return () => controller.abort();
  }, [API_URL, researchId, showPopup]);

  // Save or remove the current research bookmark
  const handleToggleBookmark = async () => {
    if (savingBookmark || checkingBookmark || !researchId) return;

    const token = sessionStorage.getItem("authToken");

    if (!token) {
      setBookmarkError("Please log in again.");
      return;
    }

    setSavingBookmark(true);
    setBookmarkError("");

    try {
      const response = await fetch(
        `${API_URL}/api/saved/${researchId}`,
        {
          method: bookmarked ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update bookmark."
        );
      }

      // Update the button using the backend response
      setBookmarked(Boolean(data.bookmarked));
    } catch (error) {
      console.error("BOOKMARK ERROR:", error);
      setBookmarkError(error.message);
    } finally {
      setSavingBookmark(false);
    }
  };

  if (!showPopup) return null;

  return (
    <div
      className="research-popup-overlay"
      onClick={closePopup}
    >
      <div
        className="research-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="research-popup-heading"
        onClick={(event) => event.stopPropagation()}
      >
        {/* POPUP HEADER */}
        <div className="research-popup-header">
          <h2 id="research-popup-heading">SUMMARY</h2>

          <button
            type="button"
            className="popup-close"
            onClick={closePopup}
            aria-label="Close summary"
          >
            ×
          </button>
        </div>

        {/* LOADING STATE */}
        {loadingResearch && (
          <div className="popup-loading">
            <h2>Loading research...</h2>
          </div>
        )}

        {/* RESEARCH DETAILS */}
        {!loadingResearch && selectedResearch && (
          <>
            <div className="research-details">
              <div className="research-popup-info">
                <h2>{selectedResearch.title}</h2>

                <p className="research-author">
                  {selectedResearch.author || "Unknown Author"}
                </p>

                <p className="research-year">
                  {selectedResearch.year || "Unknown Year"}
                </p>

                <p className="research-program">
                  {selectedResearch.program || unknownProgramLabel}
                </p>
              </div>

              {/* RESEARCH SUMMARY */}
              <div className="summary-section">
                <p>
                  {selectedResearch.summary ||
                    "No summary available."}
                </p>
              </div>
            </div>

            {/* POPUP ACTIONS */}
            <div className="research-popup-actions">
              <button
                type="button"
                className={`popup-save-btn ${
                  bookmarked ? "saved" : ""
                }`}
                onClick={handleToggleBookmark}
                disabled={
                  checkingBookmark ||
                  savingBookmark
                }
              >
                <span aria-hidden="true">
                  {bookmarked ? "★" : "☆"}
                </span>

                {checkingBookmark
                  ? "Checking..."
                  : savingBookmark
                  ? "Bookmarking..."
                  : bookmarked
                  ? "Bookmarked"
                  : "Bookmark"}
              </button>

              <button
                type="button"
                className="popup-read-btn"
                onClick={() =>
                  onReadFullResearch?.(selectedResearch)
                }
                disabled={!onReadFullResearch}
              >
                <span aria-hidden="true">▣</span>
                Read Full Research
              </button>
            </div>

            {/* BOOKMARK ERROR */}
            {bookmarkError && (
              <p className="popup-bookmark-error" role="alert">
                {bookmarkError}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResearchPopups;
