import "./searchcat.css";
import { FaSearch } from "react-icons/fa";

export default function Searchcat({
  searchTerm,
  setSearchTerm,
  navigate,
  loading,
  error,
  filteredResearches,
  handleViewResearch,
  handleViewPdfText,
}) {

  const programs = [
    "BSCS",
    "BSBA",
    "BSED",
    "BEED",
    "BSTM",
    "BSCrim",
  ];

  return (

    <main className="hero">

      <h1>
        What research are you looking for?
      </h1>

      {/* ========================================
          SEARCH
      ======================================== */}

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

      {/* ========================================
          PROGRAMS
      ======================================== */}

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

      {/* ========================================
          RESEARCH CARDS
      ======================================== */}

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

                  <div className="card-image">
                  </div>

                  <div className="card-info">

                    {/* ========================================
                        CLICKABLE TITLE
                    ======================================== */}

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

                    {/* ========================================
                        VIEW SUMMARY
                    ======================================== */}

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

    </main>

  );

}