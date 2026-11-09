
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

  // Open the PDF viewer using the correct user role
  const openPdfViewer = (researchId) => {
    navigate(
      isAdmin
        ? `/admin/fullview/${researchId}`
        : `/fullview/${researchId}`
    );
  };

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
                // Filter research by program for administrators
                setSearchTerm(program);
              } else {
                // Navigate to the selected student program
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
            <div className="library-message">
              Loading research...
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="library-message error-message">
              {error}
            </div>
          )}

          {/* NO RESULTS */}
          {!loading && !error && filteredResearches.length === 0 && (
            <div className="library-message">
              {emptyMessage}
            </div>
          )}

          {/* RESEARCH CARDS */}
          {!loading &&
            !error &&
            filteredResearches.map((research) => (
              <div className="research-card" key={research.id}>

                {/* RESEARCH POSTER */}
                <img
                  className="card-image"
                  src={
                    research.poster_url ||
                    getProgramImage(research.program)
                  }
                  alt={`${research.title} poster`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getProgramImage(
                      research.program
                    );
                  }}
                  onClick={() => openPdfViewer(research.id)}
                />

                {/* CARD INFORMATION */}
                <div className="card-info">

                  {/* Open the PDF when the title is clicked */}
                  <h3
                    className="research-title"
                    onClick={() => openPdfViewer(research.id)}
                    title="Open PDF Viewer"
                  >
                    {research.title}
                  </h3>

                  <p>
                    {research.author || "Unknown Author"}
                  </p>

                  <small>
                    {research.year || "Unknown Year"}
                  </small>

                  {/* Students can view research summaries */}
                  {!isAdmin && (
                    <button
                      type="button"
                      className="view-research-btn"
                      onClick={() =>
                        handleViewResearch(research.id)
                      }
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
