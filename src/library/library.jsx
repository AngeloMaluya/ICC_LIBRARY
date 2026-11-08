
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./base_lib.css";
import "../components/sidebar/sidebar.css";

import SearchCat from "../components/searchcat/searchcat.jsx";
import Sidebar from "../components/sidebar/sidebar.jsx";
import ResearchPopups from "../components/ResearchPopups/ResearchPopups.jsx";

import { useResearchPopups } from "../hooks/useResearchPopups.js";
import { getProgramImage } from "../utils/programImages.js";

export const Library = ({ isAdmin = false}) => {
  const navigate = useNavigate();

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

  useEffect(() => {
    document.title = "ICC Library";
  }, []);

  // LOAD AND SEARCH ALL RESEARCH
  useEffect(() => {
    const fetchResearches = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (searchTerm.trim()) {
          params.set("search", searchTerm.trim());
        }

          const endpoint = isAdmin
            ? `${API_URL}/api/research/admin-list`
            : `${API_URL}/api/research?${params.toString()}`;

          const token = sessionStorage.getItem("authToken");

          const response = await fetch(endpoint, {
            headers: isAdmin
              ? {}
              : { Authorization: `Bearer ${token}` },
          });

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
}, [API_URL, searchTerm, isAdmin]);

  return (
    <div className="library-layout">
      <Sidebar role={isAdmin ? "admin" : "student"} />

      <main className="library-main">
        <SearchCat
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          navigate={navigate}
          loading={loading}
          error={error}
          filteredResearches={researches}
          handleViewResearch={handleViewResearch}
          handleViewPdfText={handleViewPdfText}
          getProgramImage={getProgramImage}
          isAdmin={isAdmin}
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
      />
    </div>
  );
};

export default Library;
