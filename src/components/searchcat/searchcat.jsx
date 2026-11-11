
import { FaSearch } from "react-icons/fa";
import "./searchcat.css";

// College programs
const collegePrograms = [
  "BSCS",
  "BSBA",
  "BSED",
  "BEED",
  "BSTM",
  "BSCrim",
];

// Senior High School strands
const shsStrands = [
  "STEM",
  "ABM",
  "HUMSS",
  "GAS",
  "HE",
  "ICT",
];

// Full names of college programs and SHS strands
const programFullNames = {
  // College
  BSCS: "Bachelor of Science in Computer Science",
  BSBA: "Bachelor of Science in Business Administration",
  BSED: "Bachelor of Secondary Education",
  BEED: "Bachelor of Elementary Education",
  BSTM: "Bachelor of Science in Tourism Management",
  BSCrim: "Bachelor of Science in Criminology",

  // Senior High School
  STEM: "Science, Technology, Engineering, and Mathematics",
  ABM: "Accountancy, Business, and Management",
  HUMSS: "Humanities and Social Sciences",
  GAS: "General Academic Strand",
  HE: "Home Economics",
  ICT: "Information and Communications Technology",
};

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
  educationLevel: selectedEducationLevel,
}) {

  // Determine the education level of an active program
  const getProgramEducationLevel = () => {
    const program = String(activeProgram || "")
      .trim()
      .toLowerCase();

    return shsStrands.some(
      (strand) => strand.toLowerCase() === program
    )
      ? "shs"
      : "college";
  };

  // Use the active program's level when viewing a program.
  // Otherwise, use the level passed by Library.jsx.
  const educationLevel = activeProgram
    ? getProgramEducationLevel()
    : selectedEducationLevel || "college";

  // Display programs based on the selected education level
  const displayedPrograms =
    educationLevel === "college"
      ? collegePrograms
      : shsStrands;

  // Open the PDF viewer using the correct user role
  const openPdfViewer = (researchId) => {
    navigate(
      isAdmin
        ? `/admin/fullview/${researchId}`
        : `/fullview/${researchId}`
    );
  };

  // Switch education levels without automatically selecting a program
  const handleEducationLevel = (level) => {
    // Clear the previous search
    setSearchTerm("");

    if (isAdmin) {
      // Keep admin navigation within the admin area.
      // Admin level switching requires its parent to pass
      // a selectedEducationLevel value and update callback.
      if (typeof window !== "undefined") {
        // No navigation is needed for admin program filtering.
      }
      return;
    }

    // Navigate to the main library with the selected level.
    // This prevents the tab from resetting to College.
    navigate(`/library?level=${level}`);
  };

  // Handle program or strand selection
  const handleProgramClick = (program) => {
    if (isAdmin) {
      // Admin searches research using the selected program
      setSearchTerm(program);
    } else {
      // Students navigate to the selected program or strand
      navigate(`/library/${program}`);
    }
  };

  return (
    <div className="library-content">

      {/* SEARCH BAR */}
      <div className="search-box">
        <FaSearch className="search-icon" />

        <input
          type="text"
          placeholder="Search Research"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
        />
      </div>

      {/* EDUCATION LEVEL TABS */}
      <div className="education-level-tabs">

        <button
          type="button"
          className={
            educationLevel === "college"
              ? "active"
              : ""
          }
          onClick={() =>
            handleEducationLevel("college")
          }
        >
          College
        </button>

        <button
          type="button"
          className={
            educationLevel === "shs"
              ? "active"
              : ""
          }
          onClick={() =>
            handleEducationLevel("shs")
          }
        >
          Senior High School
        </button>

      </div>

      {/* PROGRAM / STRAND BUTTONS */}
      <div className="categories">
        {displayedPrograms.map((program) => (
          <button
            type="button"
            key={program}
            onClick={() =>
              handleProgramClick(program)
            }
            className={
              activeProgram &&
              program.toLowerCase() ===
                activeProgram.toLowerCase()
                ? "active-program"
                : ""
            }
          >
            {program}
          </button>
        ))}
      </div>

      {/* OPTIONAL PAGE HEADING */}
      {(heading || activeProgram) && (
        <div className="program-heading">
          <h1>
            {activeProgram
              ? programFullNames[activeProgram] || activeProgram
              : heading?.title}
          </h1>
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
          {!loading &&
            !error &&
            filteredResearches.length === 0 && (
              <div className="library-message">
                {emptyMessage}
              </div>
            )}

          {/* RESEARCH CARDS */}
          {!loading &&
            !error &&
            filteredResearches.map((research) => (
              <div
                className="research-card"
                key={research.id}
              >

                {/* RESEARCH POSTER */}
                <div className="card-image-container">
                  <img
                    className="card-image"
                    src={
                      research.poster_url ||
                      getProgramImage(research.program)
                    }
                    alt={`${research.title} poster`}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        getProgramImage(
                          research.program
                        );
                    }}
                    onClick={() =>
                      openPdfViewer(research.id)
                    }
                  />
                </div>

                {/* CARD INFORMATION */}
                <div className="card-info">

                  {/* Open the PDF when the title is clicked */}
                  <h3
                    className="research-title"
                    onClick={() =>
                      openPdfViewer(research.id)
                    }
                    title={research.title}
                  >
                    {research.title}
                  </h3>

                  {/* RESEARCH AUTHOR */}
                  <p>
                    {research.author ||
                      "Unknown Author"}
                  </p>

                  {/* RESEARCH YEAR */}
                  <small>
                    {research.year ||
                      "Unknown Year"}
                  </small>

                  {/* STUDENT SUMMARY BUTTON */}
                  {!isAdmin && (
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
                  )}

                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
