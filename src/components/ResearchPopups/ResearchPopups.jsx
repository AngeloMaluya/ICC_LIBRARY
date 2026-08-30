// Shared "summary" + "full PDF text" popups.
// This entire block (~150 lines) was duplicated, near character-for-character,
// in both library.jsx and program.jsx. Only difference: program.jsx fell back
// to the current program name instead of "Unknown Program" - that's now the
// `unknownProgramLabel` prop.
const ResearchPopups = ({
  showPopup,
  showPdfPopup,
  selectedResearch,
  selectedPdf,
  loadingResearch,
  loadingPdf,
  closePopup,
  closePdfPopup,
  unknownProgramLabel = "Unknown Program",
}) => {
  return (
    <>
      {/* SUMMARY POPUP */}
      {showPopup && (
        <div className="research-popup-overlay" onClick={closePopup}>
          <div
            className="research-popup"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="popup-close"
              onClick={closePopup}
            >
              ×
            </button>

            {loadingResearch && (
              <div className="popup-loading">
                <h2>Loading research...</h2>
              </div>
            )}

            {!loadingResearch && selectedResearch && (
              <div className="research-details">
                <h2>{selectedResearch.title}</h2>

                <p className="research-author">
                  <strong>Author:</strong>{" "}
                  {selectedResearch.author || "Unknown Author"}
                </p>

                <p className="research-year">
                  <strong>Year:</strong>{" "}
                  {selectedResearch.year || "Unknown Year"}
                </p>

                <p className="research-program">
                  <strong>Program:</strong>{" "}
                  {selectedResearch.program || unknownProgramLabel}
                </p>

                <div className="summary-section">
                  <h3>Summary</h3>
                  <p>{selectedResearch.summary || "No summary available."}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL PDF TEXT POPUP */}
      {showPdfPopup && (
        <div className="research-popup-overlay" onClick={closePdfPopup}>
          <div
            className="research-popup pdf-text-popup"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="popup-close"
              onClick={closePdfPopup}
            >
              X
            </button>

            {loadingPdf && (
              <div className="popup-loading">
                <h2>Loading PDF text...</h2>
              </div>
            )}

            {!loadingPdf && selectedPdf && (
              <div className="research-details">
                <h2>{selectedPdf.title}</h2>

                <p className="research-author">
                  <strong>Author:</strong>{" "}
                  {selectedPdf.author || "Unknown Author"}
                </p>

                <p className="research-year">
                  <strong>Year:</strong>{" "}
                  {selectedPdf.year || "Unknown Year"}
                </p>

                <hr />

                <h3 className="full-text-heading">Full Research Text</h3>

                <div className="pdf-text-content">
                  {selectedPdf.content ? (
                    <pre>{selectedPdf.content}</pre>
                  ) : (
                    <p>No extracted PDF text is available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ResearchPopups;
