import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../components/sidebar/sidebar.css";
import "./base_lib.css";

import Sidebar from "../components/sidebar/sidebar.jsx";
import SearchCat from "../components/searchcat/searchcat.jsx";
import ResearchPopups from "../components/ResearchPopups/ResearchPopups.jsx";

import { useResearchPopups } from "../hooks/useResearchPopups.js";
import { getProgramImage } from "../utils/programImages.js";

export const Program = () => {
  const navigate = useNavigate();
  const { program } = useParams();

  const API_URL = import.meta.env.VITE_API_URL;

  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    selectedResearch,
    selectedPdf,
    showPopup,
    showPdfPopup,
    loadingResearch,
    loadingPdf,
    handleViewResearch,
    handleViewPdfText,
    closePopup,
    closePdfPopup,
  } = useResearchPopups(API_URL);

  // PROGRAM NAME

  const currentProgram = program || "";

  const displayProgram =
    currentProgram.toUpperCase() === "BSCRIM"
      ? "BSCrim"
      : currentProgram.toUpperCase();

  // PAGE TITLE

  useEffect(() => {
    document.title = `${displayProgram} - ICC Library`;
  }, [displayProgram]);

  // LOAD RESEARCH

  useEffect(() => {
    const fetchResearches = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/research`);

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
        setError("Unable to load research from the database.");
      } finally {
        setLoading(false);
      }
    };

    fetchResearches();
  }, [API_URL, currentProgram]);


  // FILTER BY PROGRAM, THEN BY SEARCH TERM
  
  const programResearches = researches.filter((research) => {
    if (!currentProgram) return true;

    const researchProgram = research.program?.toString().trim().toLowerCase();
    const selectedProgram = currentProgram.toString().trim().toLowerCase();

    return researchProgram === selectedProgram;
  });

  const filteredResearches = programResearches.filter((research) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    return (
      research.title?.toLowerCase().includes(search) ||
      research.author?.toLowerCase().includes(search) ||
      research.year?.toString().includes(search) ||
      research.program?.toLowerCase().includes(search) ||
      research.content?.toLowerCase().includes(search)
    );
  });

  // RENDER

  return (
    <div className="library-layout">
      <Sidebar />

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
          activeProgram={currentProgram}
          heading={{
            title: displayProgram,
            subtitle: "Research papers and theses",
          }}
          emptyMessage={
            <>
              No research found for <strong>{displayProgram}</strong>
            </>
          }
        />
      </main>

      <ResearchPopups
        showPopup={showPopup}
        showPdfPopup={showPdfPopup}
        selectedResearch={selectedResearch}
        selectedPdf={selectedPdf}
        loadingResearch={loadingResearch}
        loadingPdf={loadingPdf}
        closePopup={closePopup}
        closePdfPopup={closePdfPopup}
        unknownProgramLabel={displayProgram}
      />
    </div>
  );
};

export default Program;
