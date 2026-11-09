
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "./base_lib.css";

import SearchCat from "../../components/searchcat/searchcat.jsx";
import ResearchPopups from "../../components/ResearchPopups/ResearchPopups.jsx";

import { useResearchPopups } from "../../hooks/useResearchPopups.js";
import { getProgramImage } from "../../utils/programImages.js";

const collegePrograms = [
  "BSCS", "BSBA", "BSED", "BEED", "BSTM", "BSCrim",
];

const shsStrands = [
  "STEM", "ABM", "HUMSS", "GAS", "HE", "ICT",
];

export const Library = ({ isAdmin = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const API_URL = import.meta.env.VITE_API_URL;

  // Read the selected education level from the URL
  const educationLevel =
    searchParams.get("level") === "shs" ? "shs" : "college";

  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Delay searching until the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Manage research summary popups
  const {
    selectedResearch,
    showPopup,
    loadingResearch,
    handleViewResearch,
    closePopup,
  } = useResearchPopups(API_URL);

  // Set the browser page title
  useEffect(() => {
    document.title = "ICC Library";
  }, []);

  // Fetch research from the backend
  useEffect(() => {
    const controller = new AbortController();

    const fetchResearches = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        // Include the search keyword
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

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({}));

          throw new Error(
            errorData.message ||
              `Failed to fetch research (HTTP ${response.status})`
          );
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        // Support both array and object API responses
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.researches)
          ? data.researches
          : [];

        setResearches(list);
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Error fetching research:", error);
        setError(error.message || "Unable to load research.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResearches();

    // Cancel outdated requests
    return () => controller.abort();
  }, [API_URL, debouncedSearchTerm, isAdmin]);

  // Filter research by education level
  const filteredByLevel = researches.filter((research) => {
    if (isAdmin) return true;

    const program = String(research.program || "")
      .trim()
      .toLowerCase();

    const allowedPrograms =
      educationLevel === "college"
        ? collegePrograms
        : shsStrands;

    return allowedPrograms.some(
      (item) => item.toLowerCase() === program
    );
  });

  // Apply the administrator's local search filter
  const filteredResearches =
    isAdmin && debouncedSearchTerm.trim()
      ? filteredByLevel.filter((research) => {
          const term = debouncedSearchTerm
            .toLowerCase()
            .trim();

          return [
            research.title,
            research.author,
            research.program,
            research.year,
          ].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(term)
          );
        })
      : filteredByLevel;

  return (
    <div className="library-layout">
      <main className="library-main">
        <SearchCat
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          navigate={navigate}
          loading={loading}
          error={error}
          filteredResearches={filteredResearches}
          handleViewResearch={handleViewResearch}
          getProgramImage={getProgramImage}
          educationLevel={educationLevel}
          isAdmin={isAdmin}
        />
      </main>

      {/* Research summary popup */}
      <ResearchPopups
        showPopup={showPopup}
        selectedResearch={selectedResearch}
        loadingResearch={loadingResearch}
        closePopup={closePopup}
        isAdmin={isAdmin}
        onReadFullResearch={(research) => {
          closePopup();

          navigate(
            isAdmin
              ? `/admin/fullview/${research.id}`
              : `/fullview/${research.id}`
          );
        }}
      />
    </div>
  );
};

export default Library;
