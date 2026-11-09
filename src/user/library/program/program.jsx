
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./program.css";
import "../base_lib.css";

import SearchCat from "../../../components/searchcat/searchcat.jsx";
import ResearchPopups from "../../../components/ResearchPopups/ResearchPopups.jsx";

import { useResearchPopups } from "../../../hooks/useResearchPopups.js";
import { getProgramImage } from "../../../utils/programImages.js";

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

  // LOAD RESEARCH FROM THE BACKEND

  useEffect(() => {
    const controller = new AbortController();

    const fetchResearches = async () => {
      try {
        setLoading(true);
        setError("");

        // GET AUTHENTICATION TOKEN

        const token = sessionStorage.getItem("authToken");

        if (!token) {
          navigate("/login");
          return;
        }

        // BUILD API URL

        const params = new URLSearchParams();

        if (currentProgram) {
          params.set("program", currentProgram);
        }

        if (searchTerm.trim()) {
          params.set("search", searchTerm.trim());
        }

        // FETCH RESEARCH WITH JWT AUTHENTICATION

        const response = await fetch(
          `${API_URL}/api/research?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        // HANDLE EXPIRED OR INVALID SESSION

        if (response.status === 401) {
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("libraryUser");

          navigate("/login");
          return;
        }

        // HANDLE API ERRORS

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({}));

          throw new Error(
            errorData.message ||
              `Failed to fetch research (${response.status})`
          );
        }

        // READ RESPONSE

        const data = await response.json();

        if (Array.isArray(data)) {
          setResearches(data);
        } else if (Array.isArray(data.researches)) {
          setResearches(data.researches);
        } else {
          setResearches([]);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Error fetching research:", error);

        setError("Unable to load research from the database.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResearches();

    return () => {
      controller.abort();
    };
  }, [API_URL, currentProgram, searchTerm, navigate]);

  // RENDER

  return (
    <div className="library-layout">

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
          activeProgram={currentProgram}
          heading={{
            title: displayProgram,
            subtitle: "Research papers and thesis",
          }}
          emptyMessage={
            <>
              No research found for{" "}
              <strong>{displayProgram}</strong>
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
