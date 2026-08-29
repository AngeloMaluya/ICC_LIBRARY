import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaUser,
  FaRegBookmark,
  FaHistory,
  FaSignOutAlt,
} from "react-icons/fa";

import "../components/sidebar/sidebar.css";
import "./base_lib.css";
import Sidebar from "../components/sidebar/sidebar.jsx";

export const Program = () => {
  const navigate = useNavigate();
  const { program } = useParams();

  const API_URL = import.meta.env.VITE_API_URL;

  const [researches, setResearches] = useState([]);

  // Selected research for summary
  const [selectedResearch, setSelectedResearch] = useState(null);

  // Selected research for full PDF text
  const [selectedPdf, setSelectedPdf] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [showPdfPopup, setShowPdfPopup] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");


  // ========================================
  // PROGRAM NAME
  // ========================================

  const currentProgram = program || "";

  const displayProgram =
    currentProgram.toUpperCase() === "BSCRIM"
      ? "BSCrim"
      : currentProgram.toUpperCase();

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

    document.title =
      `${displayProgram} - ICC Library`;

  }, [displayProgram]);


  // ========================================
  // LOAD RESEARCH
  // ========================================

  useEffect(() => {

    const fetchResearches = async () => {

      try {

        setLoading(true);
        setError("");

        console.log(
          "Fetching research for:",
          currentProgram
        );

        const response = await fetch(
          `${API_URL}/api/research`
        );

        console.log(
          "GET /api/research status:",
          response.status
        );

        if (!response.ok) {

          throw new Error(
            "Failed to fetch research"
          );

        }

        const data = await response.json();

        console.log(
          "Research from server:",
          data
        );

        if (Array.isArray(data)) {

          setResearches(data);

        } else if (
          Array.isArray(data.researches)
        ) {

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

  }, [API_URL, currentProgram]);


  // ========================================
  // VIEW RESEARCH SUMMARY
  // ========================================

  const handleViewResearch = async (id) => {

    console.log(
      "VIEW RESEARCH:",
      id
    );

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
        "Research details:",
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

      });

    } finally {

      setLoadingResearch(false);

    }

  };


  // ========================================
  // VIEW FULL PDF TEXT
  // ========================================

  const handleViewPdfText = async (id) => {

    console.log(
      "VIEW PDF TEXT:",
      id
    );

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

      setSelectedPdf(data);

    } catch (error) {

      console.error(
        "Error loading PDF text:",
        error
      );

      setSelectedPdf({

        title: "Error",

        content:
          "Unable to load the PDF text.",

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
  // CLOSE PDF POPUP
  // ========================================

  const closePdfPopup = () => {

    setShowPdfPopup(false);

    setSelectedPdf(null);

  };


  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {

    localStorage.removeItem(
      "libraryUser"
    );

    localStorage.removeItem(
      "googleEmail"
    );

    localStorage.removeItem(
      "googleName"
    );

    localStorage.removeItem(
      "googlePicture"
    );

    navigate("/login");

  };


  // ========================================
  // FILTER BY PROGRAM
  // ========================================

  const programResearches =
    researches.filter((research) => {

      if (!currentProgram) {
        return true;
      }

      const researchProgram =
        research.program
          ?.toString()
          .trim()
          .toLowerCase();

      const selectedProgram =
        currentProgram
          .toString()
          .trim()
          .toLowerCase();

      return (
        researchProgram ===
        selectedProgram
      );

    });


  // ========================================
  // SEARCH WITHIN PROGRAM
  // ========================================

  const filteredResearches =
    programResearches.filter(
      (research) => {

        const search =
          searchTerm
            .toLowerCase()
            .trim();

        if (!search) {
          return true;
        }

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

    <div className="library-layout">


      <Sidebar/>


      {/* ========================================
          MAIN
      ======================================== */}

      <main className="library-main">


        <div className="library-content">


          {/* ========================================
              PROGRAM BUTTONS
          ======================================== */}

          <div className="categories">

            {[
              "BSCS",
              "BSBA",
              "BSED",
              "BEED",
              "BSTM",
              "BSCrim",
            ].map((item) => (

              <button
                type="button"
                key={item}
                onClick={() =>
                  navigate(
                    `/library/${item}`
                  )
                }

                className={
                  item.toLowerCase() ===
                  currentProgram.toLowerCase()
                    ? "active-program"
                    : ""
                }
              >

                {item}

              </button>

            ))}

          </div>


          {/* ========================================
              PROGRAM TITLE
          ======================================== */}

          <div className="program-heading">

            <h1>
              {displayProgram}
            </h1>

            <p>
              Research papers and theses
            </p>

          </div>


          {/* ========================================
              RESEARCH AREA
          ======================================== */}

          <div className="recommend-section">


            <div className="card-container">


              {/* LOADING */}

              {loading && (

                <div className="library-message">

                  Loading research...

                </div>

              )}


              {/* ERROR */}

              {!loading &&
                error && (

                  <div className="library-message error-message">

                    {error}

                  </div>

                )}


              {/* NO RESEARCH */}

              {!loading &&
                !error &&
                filteredResearches.length === 0 && (

                  <div className="library-message">

                    No research found for{" "}

                    <strong>
                      {displayProgram}
                    </strong>

                  </div>

                )}


              {/* RESEARCH CARDS */}

              {!loading &&
                !error &&
                filteredResearches.map(
                  (research) => (

                    <div
                      className="research-card"
                      key={research.id}
                    >


                      {/* IMAGE */}

                      <img
                          className="card-image"
                          src={getProgramImage(research.program)}
                          alt={research.program || "Program"}
                          onClick={() =>
                            handleViewPdfText(research.id)
                          }
                        />


                      {/* INFO */}

                      <div className="card-info">


                        <h3
                          className="research-title"
                          onClick={() =>
                            handleViewPdfText(
                              research.id
                            )
                          }
                        >

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
                          onClick={() =>
                            handleViewResearch(
                              research.id
                            )
                          }
                        >

                          View Summary

                        </button>


                      </div>

                    </div>

                  )
                )}


            </div>

          </div>


        </div>


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
                      displayProgram}

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

export default Program;