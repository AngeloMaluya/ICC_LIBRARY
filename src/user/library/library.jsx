
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

  const educationLevel =
    searchParams.get("level") === "shs" ? "shs" : "college";

  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState("");

  // Debounce search to reduce Gemini API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Research summary popups
  const {
    selectedResearch,
    showPopup,
    loadingResearch,
    handleViewResearch,
    closePopup,
  } = useResearchPopups(API_URL);

  useEffect(() => {
    document.title = "ICC Library";
  }, []);

  // Fetch research using AI hybrid search or normal listing
  useEffect(() => {
    const controller = new AbortController();

    const fetchResearches = async () => {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("authToken");

        if (!token) {
          navigate("/login");
          return;
        }

        const search = debouncedSearchTerm.trim();

        let endpoint;

        if (isAdmin) {
          // Preserve the existing admin research listing
          endpoint = `${API_URL}/api/research/admin-list`;

        } else if (search) {
          // Gemini semantic + keyword hybrid search
          const params = new URLSearchParams({
            q: search,
          });

          endpoint =
            `${API_URL}/api/research/search?${params.toString()}`;

        } else {
          // Normal research listing when search is empty
          endpoint = `${API_URL}/api/research`;
        }

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({}));

          if (response.status === 401) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("libraryUser");

            navigate("/login");
            return;
          }

          throw new Error(
            errorData.message ||
            `Failed to fetch research (HTTP ${response.status})`
          );
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        let list = [];

        if (Array.isArray(data)) {
          list = data;
        } else if (Array.isArray(data.results)) {
          // Hybrid search response
          list = data.results;
        } else if (Array.isArray(data.researches)) {
          list = data.researches;
        }

        setResearches(list);

      } catch (error) {
        if (
          error.name === "AbortError" ||
          controller.signal.aborted
        ) {
          return;
        }

        console.error("Error fetching research:", error);

        setError(
          error.message || "Unable to load research."
        );

        setResearches([]);

      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResearches();

    return () => controller.abort();

  }, [API_URL, debouncedSearchTerm, isAdmin, navigate]);

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

  // Preserve local keyword search for administrators.
  // Student results are already ranked by the backend AI.
  const filteredResearches = isAdmin
  ? filteredByLevel.filter((research) => {
      const term = debouncedSearchTerm.toLowerCase().trim();

      if (!term) return true;

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
