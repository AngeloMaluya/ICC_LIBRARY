import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import ReportFilters from "./components/reportfilters";
import ReportStats from "./components/reportstats";

export default function ResearchViews({ 
    records, 
    filters, 
    updateFilter, 
    loading, 
    error 
    }) {

      const navigate = useNavigate();

      const handleResearchClick = (researchId) => {

      navigate(`/admin/fullview/${researchId}`)
    };
              

        const data = useMemo(() => {
          const MIN_VIEW_PERCENTAGE = 25;

          // Apply the existing filters.
          const filteredRecords = records.filter((r) => {
            if (Number(r.views || 0) <= 0) {
              return false;
            }

            const program =
              !filters.program ||
              String(r.program || "").toLowerCase() ===
                filters.program.toLowerCase();

            const search = String(r.title || "")
              .toLowerCase()
              .includes(filters.search.trim().toLowerCase());

            const date = r.lastViewedAt
              ? new Date(r.lastViewedAt)
              : null;

            const valid =
              date && !Number.isNaN(date.getTime());

            return (
              program &&
              search &&
              (!filters.startDate ||
                (valid &&
                  date >= new Date(`${filters.startDate}T00:00:00`))) &&
              (!filters.endDate ||
                (valid &&
                  date <= new Date(`${filters.endDate}T23:59:59`)))
            );
          });

            // Find the highest view count among filtered papers.
            const highestViewCount = Math.max(
              0,
              ...filteredRecords.map(
                (r) => Number(r.views) || 0
              )
            );

            // Calculate 25% of the highest view count.
            const minimumViewCount = Math.max(
              1,
              Math.ceil(
                highestViewCount * (MIN_VIEW_PERCENTAGE / 100)
              )
          );
          // Display only papers meeting the threshold.
          return filteredRecords
            .filter(
              (r) => Number(r.views || 0) >= minimumViewCount
            )
            .sort(
              (a, b) =>
                Number(b.views || 0) - Number(a.views || 0)
            );
        }, [records, filters]);
      
        const viewStats = useMemo(() => {
          // Include all research matching the report filters,
          // not just those passing the 25% threshold.
          const filteredRecords = records.filter((r) => {
            const program =
              !filters.program ||
              String(r.program || "").toLowerCase() ===
                filters.program.toLowerCase();

            const search = String(r.title || "")
              .toLowerCase()
              .includes(String(filters.search || "").trim().toLowerCase());

            const date = r.lastViewedAt
              ? new Date(r.lastViewedAt)
              : null;

            const valid = date && !Number.isNaN(date.getTime());

            return (
              program &&
              search &&
              (!filters.startDate ||
                (valid &&
                  date >= new Date(`${filters.startDate}T00:00:00`))) &&
              (!filters.endDate ||
                (valid &&
                  date <= new Date(`${filters.endDate}T23:59:59`)))
            );
          });

          const totalViews = filteredRecords.reduce(
            (sum, r) => sum + Number(r.views || 0),
            0
          );

          const viewedResearch = filteredRecords.filter(
            (r) => Number(r.views || 0) > 0
          ).length;

          const highestViews = Math.max(
            0,
            ...filteredRecords.map((r) => Number(r.views) || 0)
          );

          return [
            { label: "Total Views", value: totalViews },
            { label: "Viewed Research", value: viewedResearch },
            { label: "Highest View Count", value: highestViews },
            { label: "Popular Research", value: data.length },
          ];
        }, [records, filters, data]);


    const max = Math.max(1, ...data.map(r => Number(r.views) || 0));

    return <>
    <ReportFilters
        filters={filters}
        updateFilter={updateFilter}
      />

      <div className="reports-section-divider" />

      {!loading && !error && (
        <ReportStats
          title="Research Viewing Overview"
          stats={viewStats}
        />
      )}
      <div className="reports-section-divider" />

      <h2 className="reports-most-viewed-title">
        Most Viewed Research
      </h2>
    <div className="reports-most-viewed-list">{!loading && !error && data.length === 0 &&
            <p className="reports-empty">No viewing records found.
  </p>}{!loading && !error && data.map(r => {
            const views = Math.max(0, Number(r.views) || 0);
            return <div className="reports-view-card" key={r.id}>
  <div className="reports-view-info">
      <div className="reports-view-details">
        <strong>
          <button
            type="button"
            className="reports-research-title"
            onClick={() => handleResearchClick(r.id)}
            title={`View ${r.title}`}
          >
            {r.title}
          </button>
        </strong>

        <small>{r.program}</small>
      </div>
    <span className="reports-view-count">{views.toLocaleString()} views
    </span>
  </div>
  <div className="reports-progress-track">
    <div className="reports-progress-fill" style={{ width: `${views / max * 100}%` }}/>
  </div>
            </div>;
        })}
    </div>
    </>;
}
