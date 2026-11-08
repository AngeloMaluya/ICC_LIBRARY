import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewingHistory.css";

export default function ViewingHistory() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    document.title = "Viewing History";
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("libraryUser");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to retrieve viewing history."
        );
      }

      setHistory(data.history || []);
    } catch (error) {
      console.error("Viewing History Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear your viewing history?"
    );

    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/history`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to clear viewing history."
        );
      }

      setHistory([]);
    } catch (error) {
      console.error("Clear History Error:", error);
      alert("Unable to clear viewing history.");
    }
  };

  const handleResearchClick = (researchId) => {
    navigate(`/FullView/${researchId}`);
  };

  const getFilteredHistory = () => {
    return history.filter((item) => {
      const viewedDate = new Date(item.viewed_at);

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);

        if (viewedDate < start) {
          return false;
        }
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`);

        if (viewedDate > end) {
          return false;
        }
      }

      return true;
    });
  };

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);

    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (firstDate, secondDate) => {
      return (
        firstDate.getFullYear() === secondDate.getFullYear() &&
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getDate() === secondDate.getDate()
      );
    };

    if (isSameDay(date, today)) {
      return "TODAY";
    }

    if (isSameDay(date, yesterday)) {
      return "YESTERDAY";
    }

    return date
      .toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };

  const groupHistoryByDate = (items) => {
    const groups = {};

    items.forEach((item) => {
      const label = getDateLabel(item.viewed_at);

      if (!groups[label]) {
        groups[label] = [];
      }

      groups[label].push(item);
    });

    return groups;
  };

  const filteredHistory = getFilteredHistory();
  const groupedHistory = groupHistoryByDate(filteredHistory);

  return (
    <div className="history-page">

      <main className="history-main">
        <h1 className="history-title">Viewing History</h1>

        <div className="history-divider" />

        <div className="history-actions">
          <button
            type="button"
            className="history-filter-button"
            onClick={() => setShowFilter(true)}
            title="Filter by date"
          >
            ☷
          </button>

          <button
            type="button"
            className="history-clear-button"
            onClick={clearHistory}
            disabled={history.length === 0}
          >
            Clear
          </button>
        </div>

        {loading ? (
          <div className="history-message">
            Loading viewing history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="history-message">
            No viewing history found.
          </div>
        ) : (
          <div className="history-list">
            {Object.entries(groupedHistory).map(
              ([dateLabel, items]) => (
                <section
                  className="history-date-section"
                  key={dateLabel}
                >
                  <h3 className="history-date-label">
                    {dateLabel}
                  </h3>

                  {items.map((item) => {
                    const research = item.summarized;

                    if (!research) {
                      return null;
                    }

                    return (
                      <article
                        className="history-item"
                        key={item.id}
                      >
                        <div className="history-item-top">
                          <button
                            type="button"
                            className="history-research-title"
                            onClick={() =>
                              handleResearchClick(research.id)
                            }
                          >
                            {research.title}
                          </button>

                          <span className="history-time">
                            {new Date(
                              item.viewed_at
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="history-information">
                          {research.program || "Unknown Program"}
                          {research.author &&
                            ` | ${research.author}`}
                        </p>
                      </article>
                    );
                  })}
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
            onClick={(event) => event.stopPropagation()}
          >
            <h2>FILTER BY DATE</h2>

            <div className="history-date-inputs">
              <div className="history-date-field">
                <label>Start</label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                />
              </div>

              <span className="history-date-separator">
                -
              </span>

              <div className="history-date-field">
                <label>End</label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="history-filter-footer">
              <button
                type="button"
                onClick={() => setShowFilter(false)}
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
