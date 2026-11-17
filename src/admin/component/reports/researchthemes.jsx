
import { useMemo, useState} from "react";

import ReportFilters from "./components/reportfilters";
import ThemeResearchModal from "./components/themeresearchmodal";


export default function ResearchThemes({
  records,
  stats,
  filters,
  updateFilter,
  loading,
  error,
}) {

const [selectedTheme, setSelectedTheme] = useState(null);

const themes = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          Number(b.researchCount || 0) -
          Number(a.researchCount || 0)
      ),
    [records]
  );

  const max = Math.max(
    1,
    ...themes.map(
      (theme) => Number(theme.researchCount) || 0
    )
  );

  return (
    <>
      <ReportFilters
        filters={filters}
        updateFilter={updateFilter}
      />

      <div className="reports-section-divider" />

      <h2 className="reports-most-viewed-title">
        AI-Identified Themes
      </h2>

      {/* THEME STATISTICS */}
      {!loading && !error && stats && (
        <div
          className="reports-theme-summary"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {[
            ["Discovered Themes", stats.totalThemes ?? 0],
            [
              "Classified Papers",
              stats.totalClassifiedResearch ?? 0,
            ],
            [
              "Unclassified Papers",
              stats.totalUnclassifiedResearch ?? 0,
            ],
            ["Total Papers", stats.totalResearch ?? 0],
          ].map(([label, value]) => (
            <div
              className="reports-view-card"
              key={label}
              style={{
                flex: "1 1 160px",
                padding: 16,
              }}
            >
              <small
                style={{
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {label}
              </small>

              <strong style={{ fontSize: 22 }}>
                {Number(value).toLocaleString()}
              </strong>
            </div>
          ))}
        </div>
      )}

      <div className="reports-section-divider" />

      {/* AI-IDENTIFIED THEMES LIST */}
       <h2 className="reports-most-viewed-title">
          Most Popular Themes
        </h2>
      <div className="reports-most-viewed-list">
       
        {!loading && !error && themes.length === 0 && (
          <p className="reports-empty">
            No AI-classified research themes found.
          </p>
        )}

        {!loading &&
          !error &&
          themes.map((theme) => {
            const count = Math.max(
              0,
              Number(theme.researchCount) || 0
            );

            const percentage = (count / max) * 100;

            return (
              <div
                    className="reports-view-card reports-theme-clickable"
                    key={theme.theme}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTheme(theme.theme)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedTheme(theme.theme);
                        }
                    }}
                    title={`View research papers under ${theme.theme}`}
                    >

                <div className="reports-view-info">
                  <div className="reports-view-details">
                    <strong>{theme.theme}</strong>

                    <small>
                      {theme.description ||
                        theme.keywords?.join(", ") ||
                        "No description available."}
                    </small>

                    {Array.isArray(theme.keywords) &&
                      theme.keywords.length > 0 && (
                        <small>
                          Keywords:{" "}
                          {theme.keywords.join(", ")}
                        </small>
                      )}
                  </div>

                  <span className="reports-view-count">
                    {count.toLocaleString()}{" "}
                    {count === 1 ? "paper" : "papers"}
                  </span>
                </div>

                <div className="reports-progress-track">
                  <div
                    className="reports-progress-fill"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>
      <ThemeResearchModal
        theme={selectedTheme}
        onClose={() => setSelectedTheme(null)}
        />
    </>
  );
}
