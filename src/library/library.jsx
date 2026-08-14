import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./base_lib.css";

import { FaSearch } from "react-icons/fa";

export const Library = () => {
  const navigate = useNavigate();

  // ========================================
  // STATE
  // ========================================

  const [researches, setResearches] = useState([]);
  const [selectedResearch, setSelectedResearch] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingResearch, setLoadingResearch] = useState(false);

  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem("libraryUser");
    localStorage.removeItem("googleEmail");
    localStorage.removeItem("googleName");
    localStorage.removeItem("googlePicture");

    navigate("/");
  };

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

        const response = await fetch("/api/research");

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
  // VIEW RESEARCH
  // ========================================

  const handleViewResearch = async (id) => {
    console.log("==============================");
    console.log("VIEW RESEARCH BUTTON CLICKED");
    console.log("Research ID:", id);
    console.log("==============================");

    // Show popup immediately
    setShowPopup(true);
    setLoadingResearch(true);
    setSelectedResearch(null);

    try {
      const response = await fetch(
        `/api/research/${id}`
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
  // CLOSE POPUP
  // ========================================

  const closePopup = () => {
    console.log("Closing research popup");

    setShowPopup(false);
    setSelectedResearch(null);
  };

  // ========================================
  // PROGRAMS
  // ========================================

  const programs = [
    "BSCS",
    "BSBA",
    "BSED",
    "BEED",
    "BSTM",
    "BSCrim",
  ];

  // ========================================
  // SEARCH
  // ========================================

  const filteredResearches = researches.filter(
    (research) => {
      const search = searchTerm.toLowerCase();

      return (
        research.title
          ?.toLowerCase()
          .includes(search) ||

        research.author
          ?.toLowerCase()
          .includes(search) ||

        research.year
          ?.toString()
          .includes(search)
      );
    }
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="library">

      {/* LOGOUT */}

      <button
        type="button"
        className="logout-btn"
        onClick={handleLogout}
      >
        Log Out
      </button>

      <main className="hero">

        <h1>
          What research are you looking for?
        </h1>

        {/* SEARCH */}

        <div className="search-box">

          <FaSearch className="search-icon" />

          <input
            type="text"
            placeholder="Search books, thesis, journals..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

        </div>

        {/* PROGRAMS */}

        <div className="categories">

          {programs.map((program) => (
            <button
              type="button"
              key={program}
              onClick={() =>
                navigate(`/library/${program}`)
              }
            >
              {program}
            </button>
          ))}

        </div>

        {/* RESEARCH */}

        <div className="recommend-section">

          <div className="card-container">

            {loading && (
              <p>
                Loading research...
              </p>
            )}

            {!loading && error && (
              <p className="error-message">
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              filteredResearches.length === 0 && (
                <p>
                  No research found.
                </p>
              )}

            {!loading &&
              !error &&
              filteredResearches.map(
                (research) => (

                  <div
                    className="research-card"
                    key={research.id}
                  >

                    <div className="card-image"></div>

                    <div className="card-info">

                      <h3>
                        {research.title}
                      </h3>

                      <p>
                        {research.author ||
                          "Unknown Author"}
                      </p>

                      <small>
                        {research.year ||
                          "Unknown Year"}
                      </small>

                      <button
                        type="button"
                        className="view-research-btn"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          handleViewResearch(
                            research.id
                          );
                        }}
                      >
                        View Research
                      </button>

                    </div>

                  </div>

                )
              )}

          </div>

        </div>

      </main>

      {/* ========================================
          POPUP
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

            {/* CLOSE */}

            <button
              type="button"
              className="popup-close"
              onClick={closePopup}
            >
              ×
            </button>

            {/* LOADING */}

            {loadingResearch && (
              <div className="popup-loading">
                <h2>
                  Loading research...
                </h2>
              </div>
            )}

            {/* CONTENT */}

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

    </div>
  );
};

export default Library;