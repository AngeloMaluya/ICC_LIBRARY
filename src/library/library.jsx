import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./base_lib.css";
import "../components/sidebar/sidebar.css";

import SearchCat from "../components/searchcat/searchcat.jsx";
import Sidebar from "../components/sidebar/sidebar.jsx";

export const Library = () => {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const [researches, setResearches] = useState([]);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [showPdfPopup, setShowPdfPopup] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ========================================
  // PROGRAM PLACEHOLDER IMAGE
  // ========================================

  const getProgramImage = (programName) => {
    const normalizedProgram = programName
      ?.toString()
      .trim()
      .toUpperCase();

    const images = {
      BSCS: "/programs_placeholders/BSCS.png",
      BSBA: "/programs_placeholders/BSBA.png",
      BSED: "/programs_placeholders/BSED.png",
      BEED: "/programs_placeholders/BEED.png",
      BSTM: "/programs_placeholders/BSTM.png",
      BSCRIM: "/programs_placeholders/CRIM.png",
    };

    return (
      images[normalizedProgram] ||
      "/programs_placeholders/BSCS.png"
    );
  };

  // ========================================
  // PAGE TITLE
  // ========================================

  useEffect(() => {
    document.title = "ICC Library";
  }, []);

  // ========================================
  // LOAD ALL RESEARCH
  // ========================================

  useEffect(() => {
    const fetchResearches = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/research`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch research");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setResearches(data);
        } else if (Array.isArray(data.researches)) {
          setResearches(data.researches);
        } else {
          setResearches([]);
        }

      } catch (error) {
        console.error("Error fetching research:", error);

        setError(
          "Unable to load research from the database."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchResearches();
  }, [API_URL]);

  // ========================================
  // VIEW RESEARCH SUMMARY
  // ========================================

  const handleViewResearch = async (id) => {
    setShowPopup(true);
    setLoadingResearch(true);
    setSelectedResearch(null);

    try {
      const response = await fetch(
        `${API_URL}/api/research/${id}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load research (${response.status})`
        );
      }

      const data = await response.json();

      setSelectedResearch(data);

    } catch (error) {
      console.error("Error loading research:", error);

      setSelectedResearch({
        title: "Error",
        summary: "Unable to load this research.",
      });

    } finally {
      setLoadingResearch(false);
    }
  };

  // ========================================
  // VIEW FULL PDF TEXT
  // ========================================

  const handleViewPdfText = async (id) => {
    setShowPdfPopup(true);
    setLoadingPdf(true);
    setSelectedPdf(null);

    try {
      const response = await fetch(
        `${API_URL}/api/research/${id}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load PDF text (${response.status})`
        );
      }

      const data = await response.json();

      setSelectedPdf(data);

    } catch (error) {
      console.error("Error loading PDF text:", error);

      setSelectedPdf({
        title: "Error",
        content: "Unable to load the PDF text.",
      });

    } finally {
      setLoadingPdf(false);
    }
  };

  // ========================================
  // CLOSE POPUPS
  // ========================================

  const closePopup = () => {
    setShowPopup(false);
    setSelectedResearch(null);
  };

  const closePdfPopup = () => {
    setShowPdfPopup(false);
    setSelectedPdf(null);
  };

  // ========================================
  // SEARCH
  // ========================================

  const filteredResearches = researches.filter((research) => {
    const search = searchTerm.toLowerCase();

    return (
      research.title?.toLowerCase().includes(search) ||
      research.author?.toLowerCase().includes(search) ||
      research.year?.toString().includes(search) ||
      research.program?.toLowerCase().includes(search) ||
      research.content?.toLowerCase().includes(search)
    );
  });

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="library-layout">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="library-main">

        <SearchCat
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          navigate={navigate}
          loading={loading}
          error={error}
          filteredResearches={filteredResearches}
          handleViewResearch={handleViewResearch}
          handleViewPdfText={handleViewPdfText}
          getProgramImage={getProgramImage}
        />

      </main>

      {/* ========================================
          SUMMARY POPUP
      ======================================== */}

      {showPopup && (
        <div
          className="research-popup-overlay"
          onClick={closePopup}
        >
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

                <h2>
                  {selectedResearch.title}
                </h2>

                <p className="research-author">
                  <strong>Author:</strong>{" "}
                  {selectedResearch.author ||
                    "Unknown Author"}
                </p>

                <p className="research-year">
                  <strong>Year:</strong>{" "}
                  {selectedResearch.year ||
                    "Unknown Year"}
                </p>

                <p className="research-program">
                  <strong>Program:</strong>{" "}
                  {selectedResearch.program ||
                    "Unknown Program"}
                </p>

                <div className="summary-section">

                  <h3>Summary</h3>

                  <p>
                    {selectedResearch.summary ||
                      "No summary available."}
                  </p>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================
          FULL PDF TEXT POPUP
      ======================================== */}

      {showPdfPopup && (
        <div
          className="research-popup-overlay"
          onClick={closePdfPopup}
        >
          <div
            className="research-popup pdf-text-popup"
            onClick={(event) => event.stopPropagation()}
          >

            <button
              type="button"
              className="popup-close"
              onClick={closePdfPopup}
            >
              ×
            </button>

            {loadingPdf && (
              <div className="popup-loading">
                <h2>Loading PDF text...</h2>
              </div>
            )}

            {!loadingPdf && selectedPdf && (
              <div className="research-details">

                <h2>
                  {selectedPdf.title}
                </h2>

                <p className="research-author">
                  <strong>Author:</strong>{" "}
                  {selectedPdf.author ||
                    "Unknown Author"}
                </p>

                <p className="research-year">
                  <strong>Year:</strong>{" "}
                  {selectedPdf.year ||
                    "Unknown Year"}
                </p>

                <hr />

                <h3 className="full-text-heading">
                  Full Research Text
                </h3>

                <div className="pdf-text-content">

                  {selectedPdf.content ? (
                    <pre>
                      {selectedPdf.content}
                    </pre>
                  ) : (
                    <p>
                      No extracted PDF text is available.
                    </p>
                  )}

                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Library;