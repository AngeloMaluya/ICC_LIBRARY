import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./base_lib.css";

import SearchCat from "../../components/searchcat/searchcat.jsx";
import ResearchPopups from "../../components/ResearchPopups/ResearchPopups.jsx";

import { useResearchPopups } from "../../hooks/useResearchPopups.js";
import { getProgramImage } from "../../utils/programImages.js";

export const Library = ({ isAdmin = false}) => {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Store the keyword after the user stops typing
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Wait 400ms before performing a search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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
  const controller = new AbortController();

  const fetchResearches = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (debouncedSearchTerm.trim()) {
        params.set("search", debouncedSearchTerm.trim());
      }

      const endpoint = isAdmin
        ? `${API_URL}/api/research/admin-list`
        : `${API_URL}/api/research?${params.toString()}`;

      
      const token = sessionStorage.getItem("authToken");

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });


      const data = await response.json();

      if (controller.signal.aborted) return;

      if (Array.isArray(data)) {
        setResearches(data);
      } else if (Array.isArray(data.researches)) {
        setResearches(data.researches);
      } else {
        setResearches([]);
      }
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error("Error fetching research:", error);
      setError("Unable to load research from the database.");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  fetchResearches();

  // Cancel the previous request when the keyword changes
  return () => controller.abort();
}, [API_URL, debouncedSearchTerm, isAdmin]);

  return (
    <div className="library-layout">

      <main className="library-main">
        <SearchCat
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          navigate={navigate}
          loading={loading}
          error={error}

          filteredResearches={
            isAdmin && debouncedSearchTerm.trim()
              ? researches.filter((research) => {
                  const term = debouncedSearchTerm.toLowerCase().trim();

                  return [
                    research.title,
                    research.author,
                    research.program,
                    research.year,
                  ].some((value) =>
                    String(value ?? "").toLowerCase().includes(term)
                  );
                })
              : researches
          }

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
