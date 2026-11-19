import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiBookOpen } from "react-icons/fi";

export default function ThemeResearchModal({
  theme,
  onClose,
}) {
  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleResearchClick = (researchId) => {
    onClose();
   navigate(`/admin/fullview/${researchId}`)
  };

  useEffect(() => {
    if (!theme) return;

    const controller = new AbortController();

    const fetchResearches = async () => {
      setLoading(true);
      setError("");
      setResearches([]);

      try {
        const token = sessionStorage.getItem("authToken");
        const API_URL = import.meta.env.VITE_API_URL;

        if (!token) {
          throw new Error("Admin session not found.");
        }

        if (!API_URL) {
          throw new Error("Backend URL is not configured.");
        }

        const baseURL = API_URL.replace(/\/+$/, "");

        const url =
          `${baseURL}/api/reports/themes/researches` +
          `?theme=${encodeURIComponent(theme)}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load researches."
          );
        }

        if (!controller.signal.aborted) {
          setResearches(data.records || []);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResearches();

    return () => controller.abort();
  }, [theme]);

  useEffect(() => {
    if (!theme) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [theme, onClose]);

  if (!theme) return null;
  

  return (
    <div
      className="theme-modal-overlay"
      onClick={onClose}
    >
      <div
        className="theme-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Researches under ${theme}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="theme-modal-header">
          <h2>RESEARCHES BY THEME</h2>

          <button
            type="button"
            className="theme-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX />
          </button>
        </div>

        <div className="theme-modal-heading">
          <h3>{theme}</h3>

          {!loading && !error && (
            <p>
              {researches.length}{" "}
              {researches.length === 1
                ? "Research Paper"
                : "Research Papers"}
            </p>
          )}
        </div>

        <div className="theme-modal-content">
          {loading && (
            <p className="theme-modal-status">
              Loading research papers...
            </p>
          )}

          {error && (
            <p
              className="theme-modal-status"
              role="alert"
            >
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            researches.length === 0 && (
              <p className="theme-modal-status">
                No research papers found.
              </p>
            )}

          {!loading &&
            !error &&
            researches.map((research, index) => (
              <div
                className="theme-research-item"
                key={research.id}
              >
                <div className="theme-research-icon">
                  <FiBookOpen />
                </div>

                <div className="theme-research-details">
                 <h4 className="theme-research-title">
                  <button
                    type="button"
                    className="theme-research-title-button"
                    onClick={() => handleResearchClick(research.id)}
                    title={`View ${research.title}`}
                  >
                    {index + 1}. {research.title}
                  </button>
                </h4>

                  <p>
                    <strong>Author:</strong>{" "}
                    {research.author || "Unknown"}
                  </p>

                  <p>
                    <strong>Program:</strong>{" "}
                    {research.program || "N/A"}
                  </p>

                  <p>
                    <strong>Year:</strong>{" "}
                    {research.year || "N/A"}
                  </p>

                  {research.accession_number && (
                    <p className="theme-research-catalog">
                      {research.accession_number}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="theme-modal-footer">
          <button
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
