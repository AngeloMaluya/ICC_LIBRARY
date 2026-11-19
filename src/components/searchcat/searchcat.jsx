
import { IoSearchOutline } from "react-icons/io5";
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
  getProgramImage,
  activeProgram,
  selectedProgram = "",
  onProgramSelect,
  heading,
  emptyMessage = "No research found.",
  isAdmin = false,
  educationLevel: selectedEducationLevel,
}) {
  // Students use activeProgram; admins use selectedProgram.
  const currentProgram = isAdmin
    ? selectedProgram
    : activeProgram;
  // Determine the education level of an active program
    const getProgramEducationLevel = () => {
      const program = String(currentProgram || "")
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
const educationLevel = currentProgram
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

  // Switch education levels for both admin and students
  const handleEducationLevel = (level) => {
    // Clear the previous search
    setSearchTerm("");

    // Keep the correct route for each user role
    const basePath = isAdmin ? "/program" : "/library";

    navigate(`${basePath}?level=${level}`);
  };


  // Handle program or strand selection
    const handleProgramClick = (program) => {
      if (isAdmin) {
        // Admin selects the program without changing the search bar.
        setSearchTerm("");

        onProgramSelect?.(program);
      } else {
        // Preserve existing student navigation.
        navigate(`/library/${program}`);
      }
    };

  return (
    <div className="library-content">

      {/* SEARCH BAR */}
      <div className="search-box">
        <IoSearchOutline className="search-icon" />

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
                currentProgram &&
                program.toLowerCase() ===
                  currentProgram.toLowerCase()
                  ? "active-program"
                  : ""
              }
          >
            {program}
          </button>
        ))}
      </div>

      {/* OPTIONAL PAGE HEADING */}
        {(heading || currentProgram) && (
          <div className="program-heading">
            <h1>
              {currentProgram
                ? programFullNames[currentProgram] || currentProgram
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
                    {research.accession_number && (
                  <p className="research-catalog-number">
                    {research.accession_number}
                  </p>
                )}

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
