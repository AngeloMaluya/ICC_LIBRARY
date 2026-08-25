import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./base_lib.css";
import Header from "../components/heading/heading.jsx";
import SearchCat from "../components/searchcat/searchcat.jsx";

export const Library = () => {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;
  console.log("API_URL:", API_URL);

  const [researches, setResearches] = useState([]);

  // Research selected for summary popup
  const [selectedResearch, setSelectedResearch] = useState(null);

  // Research selected for full PDF text popup
  const [selectedPdf, setSelectedPdf] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [showPdfPopup, setShowPdfPopup] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ========================================
  // PAGE TITLE
  // ========================================

  useEffect(() => {
    document.title = "Library Management System";
  }, []);

  // ========================================
  // LOAD ALL RESEARCH
  // ========================================

  useEffect(() => {
    const fetchResearches = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("Fetching research...");

        const response = await fetch(`${API_URL}/api/research`); 

        console.log(
          "GET /api/research status:",
          response.status
        );

        if (!response.ok) {
          throw new Error("Failed to fetch research");
        }

        const data = await response.json();

        console.log("Research from server:", data);

        if (Array.isArray(data)) {
          setResearches(data);
        } else if (Array.isArray(data.researches)) {
          setResearches(data.researches);
        } else {
          console.error(
            "Unexpected research response:",
            data
          );

          setResearches([]);
        }

      } catch (error) {
        console.error(
          "Error fetching research:",
          error
        );

        setError(
          "Unable to load research from the database."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchResearches();

  }, []);

  // ========================================
  // VIEW RESEARCH SUMMARY
  // ========================================

  const handleViewResearch = async (id) => {

    console.log("==============================");
    console.log("VIEW RESEARCH BUTTON CLICKED");
    console.log("Research ID:", id);
    console.log("==============================");

    setShowPopup(true);
    setLoadingResearch(true);
    setSelectedResearch(null);

    try {

      const response = await fetch(
      `${API_URL}/api/research/${id}`
    );

      console.log(
        "Research response status:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load research (${response.status})`
        );
      }

      const data = await response.json();

      console.log(
        "Research details received:",
        data
      );

      setSelectedResearch(data);

    } catch (error) {

      console.error(
        "Error loading research:",
        error
      );

      setSelectedResearch({
        title: "Error",
        summary:
          "Unable to load this research."
      });

    } finally {

      setLoadingResearch(false);

    }

  };

  // ========================================
  // VIEW FULL PDF AS TEXT
  // ========================================

  const handleViewPdfText = async (id) => {

    console.log("==============================");
    console.log("VIEW PDF TEXT CLICKED");
    console.log("Research ID:", id);
    console.log("==============================");

    setShowPdfPopup(true);
    setLoadingPdf(true);
    setSelectedPdf(null);

    try {

      const response = await fetch(
      `${API_URL}/api/research/${id}`
    );

      console.log(
        "PDF text response status:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load PDF text (${response.status})`
        );
      }

      const data = await response.json();

      console.log(
        "PDF research received:",
        data
      );

      setSelectedPdf(data);

    } catch (error) {

      console.error(
        "Error loading PDF text:",
        error
      );

      setSelectedPdf({
        title: "Error",
        content:
          "Unable to load the PDF text."
      });

    } finally {

      setLoadingPdf(false);

    }

  };

  // ========================================
  // CLOSE SUMMARY POPUP
  // ========================================

  const closePopup = () => {

    setShowPopup(false);
    setSelectedResearch(null);

  };

  // ========================================
  // CLOSE PDF TEXT POPUP
  // ========================================

  const closePdfPopup = () => {

    setShowPdfPopup(false);
    setSelectedPdf(null);

  };

  // ========================================
  // SEARCH
  // ========================================

  const filteredResearches = researches.filter(
    (research) => {

      const search =
        searchTerm.toLowerCase();

      return (

        research.title
          ?.toLowerCase()
          .includes(search) ||

        research.author
          ?.toLowerCase()
          .includes(search) ||

        research.year
          ?.toString()
          .includes(search) ||

        research.program
          ?.toLowerCase()
          .includes(search) ||

        research.content
          ?.toLowerCase()
          .includes(search)

      );

    }
  );

  // ========================================
  // RENDER
  // ========================================

  return (

    <div className="library">

      <Header />

      <SearchCat

        searchTerm={searchTerm}

        setSearchTerm={setSearchTerm}

        navigate={navigate}

        loading={loading}

        error={error}

        filteredResearches={filteredResearches}

        handleViewResearch={handleViewResearch}

        handleViewPdfText={handleViewPdfText}

      />

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
            onClick={(event) =>
              event.stopPropagation()
            }
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

                <h2>
                  Loading research...
                </h2>

              </div>

            )}

            {!loadingResearch &&
              selectedResearch && (

                <div className="research-details">

                  <h2>
                    {selectedResearch.title}
                  </h2>

                  <p className="research-author">

                    <strong>
                      Author:
                    </strong>{" "}

                    {selectedResearch.author ||
                      "Unknown Author"}

                  </p>

                  <p className="research-year">

                    <strong>
                      Year:
                    </strong>{" "}

                    {selectedResearch.year ||
                      "Unknown Year"}

                  </p>

                  <p className="research-program">

                    <strong>
                      Program:
                    </strong>{" "}

                    {selectedResearch.program ||
                      "Unknown Program"}

                  </p>

                  <div className="summary-section">

                    <h3>
                      Summary
                    </h3>

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
            onClick={(event) =>
              event.stopPropagation()
            }
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

                <h2>
                  Loading PDF text...
                </h2>

              </div>

            )}

            {!loadingPdf &&
              selectedPdf && (

                <div className="research-details">

                  <h2>
                    {selectedPdf.title}
                  </h2>

                  <p className="research-author">

                    <strong>
                      Author:
                    </strong>{" "}

                    {selectedPdf.author ||
                      "Unknown Author"}

                  </p>

                  <p className="research-year">

                    <strong>
                      Year:
                    </strong>{" "}

                    {selectedPdf.year ||
                      "Unknown Year"}

                  </p>

                  <hr />

                  <h3>
                    Full Research Text
                  </h3>

                  <div className="pdf-text-content">

                    {selectedPdf.content ? (

                      <pre>
                        {selectedPdf.content}
                      </pre>

                    ) : (

                      <p>
                        No extracted PDF text
                        is available.
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