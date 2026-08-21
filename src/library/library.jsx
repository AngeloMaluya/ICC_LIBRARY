import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./base_lib.css";
import Header from "../components/heading/heading.jsx";
import SearchCat from "../components/searchcat/searchcat.jsx";

export const Library = () => {
  const navigate = useNavigate();

  // ========================================
  // STATE
  // ========================================

  const [selectedProgram, setSelectedProgram] = useState("");

  const [researches, setResearches] = useState([]);
  const [selectedResearch, setSelectedResearch] = useState(null);

  const [showPopup, setShowPopup] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingResearch, setLoadingResearch] = useState(false);

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
          "Unable to load this research.",
        content:
          "Unable to load the research document."
      });
    } finally {
      setLoadingResearch(false);
    }
  };

  // ========================================
  // CLOSE POPUP
  // ========================================

  const closePopup = () => {
    setShowPopup(false);
    setSelectedResearch(null);
  };

  // ========================================
  // SEARCH + PROGRAM FILTER
  // ========================================

  const filteredResearches = researches.filter(
    (research) => {
      const search = searchTerm
        .trim()
        .toLowerCase();

      const title = String(
        research.title || ""
      ).toLowerCase();

      const author = String(
        research.author || ""
      ).toLowerCase();

      const year = String(
        research.year || ""
      ).toLowerCase();

      const program = String(
        research.program || ""
      ).toLowerCase();

      const matchesSearch =
        search === "" ||
        title.includes(search) ||
        author.includes(search) ||
        year.includes(search) ||
        program.includes(search);

      const matchesProgram =
        selectedProgram === "" ||
        program ===
          selectedProgram.toLowerCase();

      return (
        matchesSearch &&
        matchesProgram
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
        selectedProgram={selectedProgram}
        setSelectedProgram={setSelectedProgram}
      />

      {/* ========================================
          RESEARCH DOCUMENT POPUP
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

            {/* CLOSE BUTTON */}

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

            {/* RESEARCH */}

            {!loadingResearch &&
              selectedResearch && (
                <div className="research-details">

                  {/* TITLE */}

                  <h2>
                    {selectedResearch.title}
                  </h2>

                  {/* AUTHOR */}

                  <p className="research-author">
                    <strong>
                      Author:
                    </strong>{" "}
                    {selectedResearch.author ||
                      "Unknown Author"}
                  </p>

                  {/* YEAR */}

                  <p className="research-year">
                    <strong>
                      Year:
                    </strong>{" "}
                    {selectedResearch.year ||
                      "Unknown Year"}
                  </p>

                  {/* DOCUMENT CONTENT */}

                  <div className="research-document">

                    {selectedResearch.content ? (
                      selectedResearch.content
                        .split("\n")
                        .map(
                          (line, index) => (
                            <p key={index}>
                              {line}
                            </p>
                          )
                        )
                    ) : (
                      <p>
                        No document text
                        available.
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