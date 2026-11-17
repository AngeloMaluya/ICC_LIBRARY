import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import ReportStats from "./components/reportstats";
import ReportFilters from "./components/reportfilters";

export default function CitationCounts({ 
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

    const data = useMemo(() => records.filter(r => Number(r.citations || 0) > 0 && 
    (!filters.program || String(r.program || "").toLowerCase() === filters.program.toLowerCase()) && 
    String(r.title || "").toLowerCase().includes(filters.search.trim().toLowerCase())).sort((a, b) => Number(b.citations || 0) - Number(a.citations || 0)), 
    [records, filters.program, filters.search]);


      const totalCiteActions = records.reduce(
        (sum, r) => sum + Number(r.citations || 0),
        0
      );

      const citedResearch = records.filter(
        (r) => Number(r.citations || 0) > 0
      ).length;

      const highestCiteCount = Math.max(
        0,
        ...records.map((r) => Number(r.citations) || 0)
      );

      const uncitedResearch = records.filter(
        (r) => Number(r.citations || 0) === 0
      ).length;

      const citationStats = [
        {
          label: "Total Cite Actions",
          value: totalCiteActions,
        },
        {
          label: "Cited Research",
          value: citedResearch,
        },
        {
          label: "Highest Cite Count",
          value: highestCiteCount,
        },
        {
          label: "Uncited Research",
          value: uncitedResearch,
        },
      ];


    const max = Math.max(1, ...data.map(r => Number(r.citations) || 0));

    return <>

    <ReportFilters filters={filters} updateFilter={updateFilter}/>
    
    <div className="reports-section-divider"/>
    {!loading && !error && (
        <ReportStats
          title="Citation Activity Overview"
          stats={citationStats}
        />
      )}
          <div className="reports-section-divider"/>
          
    <div className="reports-most-viewed-list">{!loading && !error && data.length === 0 &&
            <p className="reports-empty">No citation records found.
  </p>}{!loading && !error && data.map(r => {
            const count = Number(r.citations) || 0;
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
    </div>
    <span className="reports-view-count">{count.toLocaleString()} cited
    </span>
  </div>
  <div className="reports-progress-track">
    <div className="reports-progress-fill" style={{ width: `${count / max * 100}%` }}/>
  </div>
            </div>;
        })}
    </div>
    </>;
}
