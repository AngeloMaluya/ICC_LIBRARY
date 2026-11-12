import { getProgramImage } from "../../utils/programImages.js";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewingHIstory.css";

const API_URL = import.meta.env.VITE_API_URL;

function getDateLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ViewingHistory() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    document.title = "Viewing History";

    const controller = new AbortController();

    async function fetchHistory() {
      const token = sessionStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("libraryUser");
          navigate("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load viewing history."
          );
        }

        if (!controller.signal.aborted) {
          setHistory(data.history || []);
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("VIEWING HISTORY ERROR:", err);
        setError(err.message || "Unable to load history.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchHistory();

    return () => controller.abort();
  }, [navigate]);

  const groupedHistory = useMemo(() => {
    const filtered = history
      .filter((item) => {
        if (!item.summarized) return false;

        const viewed = new Date(item.viewed_at);

        if (startDate && viewed < new Date(`${startDate}T00:00:00`)) {
          return false;
        }

        if (endDate && viewed > new Date(`${endDate}T23:59:59.999`)) {
          return false;
        }

        return true;
      })
      .sort((a, b) =>
        sortOrder === "newest"
          ? new Date(b.viewed_at) - new Date(a.viewed_at)
          : new Date(a.viewed_at) - new Date(b.viewed_at)
      );

    const groups = {};

    filtered.forEach((item) => {
      const label = getDateLabel(item.viewed_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return groups;
  }, [history, startDate, endDate, sortOrder]);

  const openResearch = (researchId) => {
    navigate(`/fullview/${researchId}`);
  };

  return (
    <div className="history-page">
      <main className="history-main">

        <header className="history-header">
          <div>
            <h1 className="history-title">Viewing History</h1>
            <p className="history-subtitle">
              Research papers and theses you have previously viewed.
            </p>
          </div>

          <div className="history-actions">
            <button
              type="button"
              className="history-filter-button"
              onClick={() => setShowFilter(true)}
            >
              Filter
            </button>
          </div>
        </header>

        {loading ? (
          <p className="history-message">Loading history...</p>
        ) : error ? (
          <p className="history-message history-error">{error}</p>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <p className="history-message">No viewing history found.</p>
        ) : (
          <div className="history-list">
            {Object.entries(groupedHistory).map(
              ([dateLabel, items], index) => (
                <section className="history-date-section" key={dateLabel}>
                  <div className="history-date-header">
                    <h2>{dateLabel}</h2>

                    {index === 0 && (
                      <button
                        type="button"
                        className="history-sort-button"
                        onClick={() =>
                          setSortOrder((current) =>
                            current === "newest" ? "oldest" : "newest"
                          )
                        }
                      >
                        {sortOrder === "newest" ? "Newest" : "Oldest"}
                      </button>
                    )}
                  </div>

                  <div className="history-card-list">
                    {items.map((item) => {
                      const research = item.summarized;

                      return (
                        <article className="history-card" key={item.id}>
                          <div className="history-card-top">
                            <div className="history-pdf-thumbnail">
                            <img
                                src={
                                  research.poster_url ||
                                  getProgramImage(research.program)
                                }
                                alt={research.title || "Research cover"}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.src = getProgramImage(research.program);
                                }}
                              />
                              </div>
                            <div className="history-card-info">
                              <h3>
                                {research.title || "Untitled Research"}
                              </h3>

                              <p className="history-card-year">
                                {research.year || "Unknown Year"}
                              </p>

                              <span className="history-program">
                                {research.program || "Unknown Program"}
                              </span>
                            </div>
                          </div>

                          <div className="history-card-bottom">
                            <div className="history-viewed-info">
                              <span>
                                {formatDate(item.viewed_at)}
                              </span>
                              <span>
                                Viewed at {formatTime(item.viewed_at)}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="history-read-button"
                              onClick={() => openResearch(research.id)}
                            >
                              <span aria-hidden="true">▣</span>
                              Read Again
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )
            )}
          </div>
        )}
      </main>

      {showFilter && (
        <div
          className="history-filter-overlay"
          onClick={() => setShowFilter(false)}
        >
          <div
            className="history-filter-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-filter-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="history-filter-title">FILTER BY DATE</h2>

            <div className="history-date-inputs">
              <div className="history-date-field">
                <label htmlFor="history-start">Start</label>
                <input
                  id="history-start"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <span className="history-date-separator">–</span>

              <div className="history-date-field">
                <label htmlFor="history-end">End</label>
                <input
                  id="history-end"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="history-filter-footer">
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              >
                RESET
              </button>

              <button type="button" onClick={() => setShowFilter(false)}>
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
