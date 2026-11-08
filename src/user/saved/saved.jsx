
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookmark,
  FaRegFilePdf,
  FaSearch,
  FaEye,
  FaTrashAlt,
  FaLayerGroup,
} from "react-icons/fa";

import "./Saved.css";

const PROGRAMS = [
  "BSCS",
  "BSBA",
  "BSED",
  "BEED",
  "BSTM",
  "BSCrim",
];

export default function Saved() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [saved, setSaved] = useState([]);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    document.title = "Saved Research - ICC Library";

    const controller = new AbortController();

    async function loadSaved() {
      try {
        const token = sessionStorage.getItem("authToken");

        const response = await fetch(`${API_URL}/api/saved`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load bookmarks.");
        }

        setSaved(data.saved || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadSaved();

    return () => controller.abort();
  }, [API_URL]);

  const filteredSaved = useMemo(() => {
    const query = search.trim().toLowerCase();

    return saved.filter((item) => {
      const research = item.summarized;
      if (!research) return false;

      const matchesProgram =
        program === "All" ||
        research.program?.toLowerCase() === program.toLowerCase();

      const matchesSearch =
        !query ||
        [research.title, research.author, research.year, research.program]
          .some((value) =>
            String(value ?? "").toLowerCase().includes(query)
          );

      return matchesProgram && matchesSearch;
    });
  }, [saved, search, program]);

  const programCount = new Set(
    saved.map((item) => item.summarized?.program).filter(Boolean)
  ).size;

  async function removeBookmark(researchId) {
    if (removingId !== null) return;

    try {
      setRemovingId(researchId);

      const token = sessionStorage.getItem("authToken");

      const response = await fetch(
        `${API_URL}/api/saved/${researchId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove bookmark.");
      }

      setSaved((previous) =>
        previous.filter((item) => item.research_id !== researchId)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="saved-page">
      <div className="saved-header">
        <div className="saved-header-icon">
          <FaBookmark />
        </div>

        <div>
          <h1>Saved Research</h1>
          <p>Your personal collection of bookmarked research papers.</p>
        </div>
      </div>

      <div className="saved-stats">
        <div className="saved-stat saved-stat-blue">
          <FaBookmark />
          <div>
            <span>Total Saved</span>
            <strong>{saved.length}</strong>
          </div>
        </div>

        <div className="saved-stat saved-stat-yellow">
          <FaLayerGroup />
          <div>
            <span>Programs</span>
            <strong>{programCount}</strong>
          </div>
        </div>
      </div>

      <div className="saved-toolbar">
        <div className="saved-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search saved research..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={program}
          onChange={(event) => setProgram(event.target.value)}
          aria-label="Filter by program"
        >
          <option value="All">All Programs</option>
          {PROGRAMS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="saved-message">Loading saved research...</p>}

      {!loading && error && (
        <p className="saved-message saved-error">{error}</p>
      )}

      {!loading && !error && filteredSaved.length === 0 && (
        <div className="saved-empty">
          <FaBookmark />
          <h2>No saved research found</h2>
          <p>
            {saved.length === 0
              ? "Bookmark research papers from the library to see them here."
              : "Try another search or program filter."}
          </p>

          {saved.length === 0 && (
            <button onClick={() => navigate("/library")}>
              Browse Library
            </button>
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="saved-grid">
          {filteredSaved.map((item) => {
            const research = item.summarized;

            return (
              <article className="saved-card" key={item.id}>
                <FaBookmark className="saved-card-bookmark" />

                <div className="saved-card-content">
                  <div className="saved-pdf-icon">
                    <FaRegFilePdf />
                  </div>

                  <div className="saved-card-details">
                    <h3 title={research.title}>{research.title}</h3>
                    <p>{research.author || "Unknown author"}</p>

                    <div className="saved-tags">
                      <span className="saved-program">
                        {research.program}
                      </span>
                      <span className="saved-year">
                        {research.year}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="saved-card-actions">
                  <button
                    className="saved-view"
                    onClick={() =>
                      navigate(`/fullview/${research.id}`)
                    }
                  >
                    <FaEye /> View PDF
                  </button>

                  <button
                    className="saved-remove"
                    disabled={removingId !== null}
                    onClick={() => removeBookmark(research.id)}
                  >
                    <FaTrashAlt />
                    {removingId === research.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
