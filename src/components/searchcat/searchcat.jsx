import { FaSearch } from "react-icons/fa";
import "./searchcat.css";

const PROGRAMS = ["BSCS", "BSBA", "BSED", "BEED", "BSTM", "BSCrim"];

export default function SearchCat({
  searchTerm,
  setSearchTerm,
  navigate,
  loading,
  error,
  filteredResearches,
  handleViewResearch,
  handleViewPdfText,
  getProgramImage,
  activeProgram,
  heading,
  emptyMessage = "No research found.",
  isAdmin = false,
}) {
  return (
    <div className="library-content">
      {/* SEARCH BAR */}
      <div className="search-box">
        <FaSearch className="search-icon" />

        <input
          type="text"
          placeholder="Search books, thesis, journals..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {/* PROGRAM BUTTONS */}
      <div className="categories">
        {PROGRAMS.map((program) => (
          <button
            type="button"
            key={program}
            onClick={() => {
              if (isAdmin) {
                setSearchTerm(program);
              } else {
                navigate(`/library/${program}`);
              }
            }}
            className={
              activeProgram &&
              program.toLowerCase() === activeProgram.toLowerCase()
                ? "active-program"
                : ""
            }
          >
            {program}
          </button>
        ))}
      </div>

      {/* OPTIONAL PAGE HEADING */}
      {heading && (
        <div className="program-heading">
          <h1>{heading.title}</h1>
          <p>{heading.subtitle}</p>
        </div>
      )}

      {/* RESEARCH AREA */}
      <div className="recommend-section">
        <div className="card-container">
          {/* LOADING */}
          {loading && (
            <div className="library-message">Loading research...</div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="library-message error-message">{error}</div>
          )}

          {/* NO RESULTS */}
          {!loading && !error && filteredResearches.length === 0 && (
            <div className="library-message">{emptyMessage}</div>
          )}

          {/* RESEARCH */}
          {!loading &&
            !error &&
            filteredResearches.map((research) => (
              <div className="research-card" key={research.id}>
                {/* PLACEHOLDER IMAGE */}
                <img
                  className="card-image"
                   src={
                    research.poster_url ||
                    getProgramImage(research.program)
                  }
                  alt={`${research.title} poster`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getProgramImage(research.program);
                  }}
                  onClick={() => navigate(`/fullview/${research.id}`)}
                />

                {/* CARD INFORMATION */}
                <div className="card-info">
                 <h3
                  className="research-title"
                  onClick={() => navigate(`/fullview/${research.id}`)}
                  title="Open PDF Viewer"
                >
                  {research.title}
                </h3>

                  <p>{research.author || "Unknown Author"}</p>

                  <small>{research.year || "Unknown Year"}</small>
                  
                  {!isAdmin && (
                  <button
                    type="button"
                    className="view-research-btn"
                    onClick={() => handleViewResearch(research.id)}
                  >
                    View Summary
                  </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
