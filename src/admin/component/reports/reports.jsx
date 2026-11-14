import { useEffect, useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiEye,
  FiPrinter,
} from "react-icons/fi";
import { LuSwatchBook } from "react-icons/lu";
import { FaQuoteLeft } from "react-icons/fa";
import "./reports.css";
const REPORT_TYPES = [
  {
    id: "viewing",
    title: "Research Views",
    description:
      "Number of times each research document has been opened.",
    icon: FiEye,
  },
  {
    id: "collection",
    title: "Popular Research Themes",
    description:
      "AI identifies and categorizes research into common topics.",
    icon: LuSwatchBook,
  },
  {
    id: "citations",
    title: "Citation Counts",
    description: "Number of times students used the Cite feature for research documents.",
    icon: FaQuoteLeft,
  },
];
const PROGRAMS = [
  "BSCS",
  "BSBA",
  "BSED",
  "BEED",
  "BSTM",
  "BSCrim",
  "STEM",
  "ABM",
  "HUMSS",
  "GAS",
  "HE",
  "ICT",
];
const PROGRAM_OPTIONS = [
  { value: "", label: "All Programs" },
  ...PROGRAMS.map((program) => ({
    value: program,
    label: program,
  })),
];
const INITIAL_FILTERS = {
  program: "",
  userType: "",
  activity: "",
  search: "",
  startDate: "",
  endDate: "",
};
const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}) => (
  <label className="report-filter">
    {label && <span>{label}</span>}
    <select value={value} onChange={onChange}>
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  </label>
);
const DateFilters = ({
  filters,
  updateFilter,
}) => (
  <div className="reports-date-grid">
    <label className="report-filter">
      <span>Date From</span>
      <input
        type="date"
        value={filters.startDate}
        max={filters.endDate || undefined}
        onChange={(event) =>
          updateFilter(
            "startDate",
            event.target.value
          )
        }
      />
    </label>
    <label className="report-filter">
      <span>Date To</span>
      <input
        type="date"
        value={filters.endDate}
        min={filters.startDate || undefined}
        onChange={(event) =>
          updateFilter(
            "endDate",
            event.target.value
          )
        }
      />
    </label>
  </div>
);
export default function Reports() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [activeReport, setActiveReport] =
    useState(null);
  const [filters, setFilters] = useState({
    ...INITIAL_FILTERS,
  });
  const [viewingRecords, setViewingRecords] =
    useState([]);
  const [themeRecords, setThemeRecords] =
    useState([]);
  const [themeStats, setThemeStats] = useState(null);
  const [citationRecords, setCitationRecords] = useState([]);
  const [activityRecords, setActivityRecords] =
    useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    document.title = "Admin Reports";
  }, []);
  const updateFilter = (name, value) => {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const openReport = (reportId) => {
    setFilters({ ...INITIAL_FILTERS });
    setError("");
    setActiveReport(reportId);
  };
  const selectedReport = REPORT_TYPES.find(
    (report) => report.id === activeReport
  );
  /* ========================================
     FETCH REPORT DATA
  ======================================== */
  useEffect(() => {
    if (!activeReport) return;
    const controller = new AbortController();
    const fetchReport = async () => {
      setLoading(true);
      setError("");
      try {
        const token =
          sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error(
            "Please log in as an administrator."
          );
        }
        if (!API_URL) {
          throw new Error(
            "Backend URL is not configured."
          );
        }
        const endpoint =
          activeReport === "viewing"
            ? "viewing"
            : activeReport === "collection"
              ? "themes"
              : activeReport === "citations"
                ? "citations"
                : "activity";
        const params = new URLSearchParams();
        // Theme filters are processed by the backend
        if (activeReport === "collection") {
          if (filters.search.trim()) {
            params.set(
              "search",
              filters.search.trim()
            );
          }
          if (filters.program) {
            params.set(
              "program",
              filters.program
            );
          }
          if (filters.startDate) {
            params.set(
              "startDate",
              filters.startDate
            );
          }
          if (filters.endDate) {
            params.set(
              "endDate",
              filters.endDate
            );
          }
        }
        if (activeReport === "citations") {
          if (filters.startDate) params.set("startDate", filters.startDate);
          if (filters.endDate) params.set("endDate", filters.endDate);
        }
        const query = params.toString();
        const url =
          `${API_URL.replace(/\/+$/, "")}/api/reports/${endpoint}` +
          (query ? `?${query}` : "");
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
          const contentType =
            response.headers.get("content-type") || "";
          if (!contentType.includes("application/json")) {
            throw new Error(
              `The server returned HTML instead of JSON. ` +
              `Check the backend URL and /api/reports/${endpoint} route. ` +
              `(HTTP ${response.status})`
            );
          }
          const data = await response.json();
          if (!response.ok) {
            throw new Error(
              data.message || "Failed to load report."
            );
          }
        if (controller.signal.aborted) return;
        if (activeReport === "viewing") {
          setViewingRecords(data.records || []);
        }
        if (activeReport === "collection") {
          setThemeRecords(data.records || []);
          setThemeStats(data);
        }
        if (activeReport === "citations") {
          setCitationRecords(data.records || []);
        }
        if (activeReport === "activity") {
          setActivityRecords(data.records || []);
        }
      } catch (err) {
        if (
          err.name === "AbortError" ||
          controller.signal.aborted
        ) {
          return;
        }
        setError(
          err.message || "Unable to load report."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    // Debounce theme searches to avoid
    // requesting data on every keystroke.
    const delay =
      activeReport === "collection" ? 350 : 0;
    const timer = setTimeout(fetchReport, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    activeReport,
    API_URL,
    ...(["collection", "citations"].includes(activeReport)
      ? [
          filters.search,
          filters.program,
          filters.startDate,
          filters.endDate,
        ]
      : []),
  ]);
  /* ========================================
     RESEARCH VIEWS FILTERS
  ======================================== */
  const viewingData = useMemo(() => {
    return viewingRecords
      .filter((record) => {
        if (Number(record.views || 0) <= 0) return false;
        const matchesProgram =
          !filters.program ||
          String(record.program || "")
            .toLowerCase() ===
            filters.program.toLowerCase();
        const matchesSearch =
          String(record.title || "")
            .toLowerCase()
            .includes(
              filters.search
                .toLowerCase()
                .trim()
            );
        const recordDate = record.lastViewedAt
          ? new Date(record.lastViewedAt)
          : null;
        const validDate =
          recordDate &&
          !Number.isNaN(recordDate.getTime());
        const matchesStart =
          !filters.startDate ||
          (validDate &&
            recordDate >=
              new Date(
                `${filters.startDate}T00:00:00`
              ));
        const matchesEnd =
          !filters.endDate ||
          (validDate &&
            recordDate <=
              new Date(
                `${filters.endDate}T23:59:59`
              ));
        return (
          matchesProgram &&
          matchesSearch &&
          matchesStart &&
          matchesEnd
        );
      })
      .sort(
        (a, b) =>
          Number(b.views || 0) -
          Number(a.views || 0)
      );
  }, [viewingRecords, filters]);
  const maxViews = useMemo(() => {
    return Math.max(
      1,
      ...viewingData.map(
        (record) => Number(record.views) || 0
      )
    );
  }, [viewingData]);
  /* ========================================
     AI RESEARCH THEMES
  ======================================== */
  const sortedThemes = useMemo(() => {
    return [...themeRecords].sort(
      (a, b) =>
        Number(b.researchCount || 0) -
        Number(a.researchCount || 0)
    );
  }, [themeRecords]);
  const maxThemeCount = useMemo(() => {
    return Math.max(
      1,
      ...sortedThemes.map(
        (theme) =>
          Number(theme.researchCount) || 0
      )
    );
  }, [sortedThemes]);
  const citationData = useMemo(() => citationRecords.filter((record) => {
    if (Number(record.citations || 0) <= 0) return false;
    const matchesProgram = !filters.program ||
      String(record.program || "").toLowerCase() === filters.program.toLowerCase();
    const matchesSearch = String(record.title || "")
      .toLowerCase().includes(filters.search.trim().toLowerCase());
    return matchesProgram && matchesSearch;
  }).sort((a, b) => Number(b.citations || 0) - Number(a.citations || 0)),
  [citationRecords, filters.program, filters.search]);
  const maxCitations = Math.max(1, ...citationData.map((item) => Number(item.citations) || 0));
  /* ========================================
     USER ACTIVITY FILTERS
  ======================================== */
  const activityData = useMemo(() => {
    return activityRecords.filter((record) => {
      const matchesType =
        !filters.userType ||
        String(record.userType || "")
          .toLowerCase() ===
          filters.userType.toLowerCase();
      const matchesActivity =
        !filters.activity ||
        record.activity === filters.activity;
      const matchesSearch =
        `${record.user || ""} ${record.activity || ""}`
          .toLowerCase()
          .includes(
            filters.search
              .toLowerCase()
              .trim()
          );
      const date = record.createdAt
        ? new Date(record.createdAt)
        : null;
      const validDate =
        date && !Number.isNaN(date.getTime());
      const matchesStart =
        !filters.startDate ||
        (validDate &&
          date >=
            new Date(
              `${filters.startDate}T00:00:00`
            ));
      const matchesEnd =
        !filters.endDate ||
        (validDate &&
          date <=
            new Date(
              `${filters.endDate}T23:59:59`
            ));
      return (
        matchesType &&
        matchesActivity &&
        matchesSearch &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [activityRecords, filters]);
  /* ========================================
     PRINT REPORT
  ======================================== */
  const printReport = () => {
    if (!activeReport || loading || error) {
      return;
    }
    window.print();
  };
  /* ========================================
     SHARED FILTERS
  ======================================== */
  const researchFilters = (
    <>
      <input
        className="reports-search"
        type="text"
        placeholder="Search Research Title"
        value={filters.search}
        onChange={(event) =>
          updateFilter(
            "search",
            event.target.value
          )
        }
      />
      <FilterSelect
        value={filters.program}
        onChange={(event) =>
          updateFilter(
            "program",
            event.target.value
          )
        }
        options={PROGRAM_OPTIONS}
      />
      <DateFilters
        filters={filters}
        updateFilter={updateFilter}
      />
    </>
  );
  return (
    <div className="admin-reports-layout">
      <main className="reports-main">
        {/* REPORT SELECTION PAGE */}
        {!activeReport ? (
          <>
            <header className="reports-page-header">
              <h1>Reports</h1>
              <p>
                Generate and manage library
                research repository reports.
              </p>
            </header>
            <section className="reports-selection">
              <h2>Select Report</h2>
              <div className="reports-selection-list">
                {REPORT_TYPES.map((report) => {
                  const Icon = report.icon;
                  return (
                    <button
                      type="button"
                      key={report.id}
                      className="reports-option"
                      onClick={() =>
                        openReport(report.id)
                      }
                    >
                      <Icon className="reports-option-icon" />
                      <span className="reports-option-text">
                        <strong>
                          {report.title}
                        </strong>
                        <small>
                          {report.description}
                        </small>
                      </span>
                      <FiChevronLeft className="reports-option-arrow" />
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* REPORT DETAIL HEADER */}
            <header className="reports-page-header reports-detail-header">
              <button
                type="button"
                className="reports-back-button"
                onClick={() =>
                  setActiveReport(null)
                }
                aria-label="Back to reports"
              >
                <FiChevronLeft />
              </button>
              <div>
                <h1>
                  {selectedReport?.title}
                </h1>
                <p>
                  {selectedReport?.description}
                </p>
              </div>
            </header>
            <section className="reports-detail">
              {loading && (
                <p className="reports-status">
                  Loading report data...
                </p>
              )}
              {error && (
                <p
                  className="reports-status reports-error"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {/* ============================
                  RESEARCH VIEWS
              ============================ */}
              {activeReport === "viewing" && (
                <>
                  {researchFilters}
                  <div className="reports-section-divider" />
                  <h2 className="reports-most-viewed-title">
                    Most Viewed Research
                  </h2>
                  <div className="reports-most-viewed-list">
                    {!loading &&
                      !error &&
                      viewingData.length === 0 && (
                        <p className="reports-empty">
                          No viewing records found.
                        </p>
                      )}
                    {!loading &&
                      !error &&
                      viewingData.map((research) => {
                        const views = Math.max(
                          0,
                          Number(research.views) || 0
                        );
                        const percentage =
                          (views / maxViews) * 100;
                        return (
                          <div
                            className="reports-view-card"
                            key={research.id}
                          >
                            <div className="reports-view-info">
                              <div className="reports-view-details">
                                <strong>
                                  {research.title}
                                </strong>
                                <small>
                                  {research.program}
                                </small>
                              </div>
                              <span className="reports-view-count">
                                {views.toLocaleString()} views
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
                </>
              )}
              {/* ============================
                  POPULAR RESEARCH THEMES
              ============================ */}
              {activeReport === "collection" && (
                <>
                  {researchFilters}
                  <div className="reports-section-divider" />
                  <h2 className="reports-most-viewed-title">
                    AI-Identified Themes
                  </h2>
                  {!loading && !error && themeStats && (
                    <div className="reports-theme-summary" style={{
                      display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px"
                    }}>
                      {[
                        ["Discovered Themes", themeStats.totalThemes ?? 0],
                        ["Classified Papers", themeStats.totalClassifiedResearch ?? 0],
                        ["Unclassified Papers", themeStats.totalUnclassifiedResearch ?? 0],
                        ["Total Papers", themeStats.totalResearch ?? 0],
                      ].map(([label, value]) => (
                        <div key={label} className="reports-view-card" style={{
                          flex: "1 1 160px", padding: "16px"
                        }}>
                          <small style={{display:"block", marginBottom:"6px"}}>{label}</small>
                          <strong style={{fontSize:"22px"}}>{Number(value).toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="reports-most-viewed-list">
                    {!loading &&
                      !error &&
                      sortedThemes.length === 0 && (
                        <p className="reports-empty">
                          No AI-classified research
                          themes found.
                        </p>
                      )}
                    {!loading &&
                      !error &&
                      sortedThemes.map((theme) => {
                        const count = Math.max(
                          0,
                          Number(
                            theme.researchCount
                          ) || 0
                        );
                        const percentage =
                          (count / maxThemeCount) *
                          100;
                        return (
                          <div
                            className="reports-view-card"
                            key={theme.theme}
                          >
                            <div className="reports-view-info">
                              <div className="reports-view-details">
                                <strong>
                                  {theme.theme}
                                </strong>
                                <small>
                                  {theme.description ||
                                    theme.keywords?.join(
                                      ", "
                                    ) ||
                                    "No description available."}
                                </small>
                                {Array.isArray(
                                  theme.keywords
                                ) &&
                                  theme.keywords.length >
                                    0 && (
                                    <small>
                                      Keywords:{" "}
                                      {theme.keywords.join(
                                        ", "
                                      )}
                                    </small>
                                  )}
                              </div>
                              <span className="reports-view-count">
                                {count.toLocaleString()}{" "}
                                {count === 1
                                  ? "paper"
                                  : "papers"}
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
                  {!loading && !error && themeStats?.underrepresentedThemes?.length > 0 && (
                    <section className="reports-underrepresented" style={{ marginTop: 28 }}>
                      <h2 className="reports-most-viewed-title">Underrepresented Research Themes</h2>
                      <p>These themes have fewer papers than the average in the selected collection. This is not proof of an academic research gap.</p>
                      <div className="reports-most-viewed-list">
                        {themeStats.underrepresentedThemes.map((theme) => (
                          <div className="reports-view-card" key={theme.theme}>
                            <div className="reports-view-info">
                              <div className="reports-view-details">
                                <strong>{theme.theme}</strong>
                                <small>{theme.description || "No description available."}</small>
                              </div>
                              <span className="reports-view-count">
                                {theme.researchCount} {theme.researchCount === 1 ? "paper" : "papers"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
              {/* ============================
                  USER ACTIVITY
              ============================ */}
                {/* CITATION COUNTS */}
                {activeReport === "citations" && (
                  <>
                    {researchFilters}
                    <div className="reports-section-divider" />
                    <div className="reports-most-viewed-list">
                      {!loading && !error && citationData.length === 0 && (
                        <p className="reports-empty">No citation records found.</p>
                      )}
                      {!loading && !error && citationData.map((research) => {
                        const count = Number(research.citations) || 0;
                        const percentage = (count / maxCitations) * 100;
                        return (
                          <div className="reports-view-card" key={research.id}>
                            <div className="reports-view-info">
                              <div className="reports-view-details">
                                <strong>{research.title}</strong>
                                <small>{research.program}</small>
                              </div>
                              <span className="reports-view-count">
                                {count.toLocaleString()} cited
                              </span>
                            </div>
                            <div className="reports-progress-track">
                              <div className="reports-progress-fill" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              {activeReport === "activity" && (
                <>
                  <h2>Report Filters</h2>
                  <div className="reports-filter-grid">
                    <FilterSelect
                      label="User Type"
                      value={filters.userType}
                      onChange={(event) =>
                        updateFilter(
                          "userType",
                          event.target.value
                        )
                      }
                      options={[
                        {
                          value: "",
                          label: "All User Types",
                        },
                        {
                          value: "student",
                          label: "Student",
                        },
                        {
                          value: "admin",
                          label: "Admin",
                        },
                      ]}
                    />
                    <FilterSelect
                      label="Activity"
                      value={filters.activity}
                      onChange={(event) =>
                        updateFilter(
                          "activity",
                          event.target.value
                        )
                      }
                      options={[
                        {
                          value: "",
                          label: "All Activities",
                        },
                        {
                          value: "Login",
                          label: "Login",
                        },
                        {
                          value: "View Research",
                          label: "View Research",
                        },
                        {
                          value: "Upload Research",
                          label: "Upload Research",
                        },
                        {
                          value: "Logout",
                          label: "Logout",
                        },
                      ]}
                    />
                  </div>
                  <input
                    className="reports-search"
                    type="text"
                    placeholder="Search user email or activity..."
                    value={filters.search}
                    onChange={(event) =>
                      updateFilter(
                        "search",
                        event.target.value
                      )
                    }
                  />
                  <DateFilters
                    filters={filters}
                    updateFilter={updateFilter}
                  />
                  <div className="reports-table-container">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>User Type</th>
                          <th>Activity</th>
                          <th>Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!loading &&
                          !error &&
                          activityData.length ===
                            0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              className="reports-table-empty"
                            >
                              No user activity
                              records found.
                            </td>
                          </tr>
                        ) : (
                          !loading &&
                          !error &&
                          activityData.map(
                            (record) => (
                              <tr key={record.id}>
                                <td>
                                  {record.user}
                                </td>
                                <td>
                                  {record.userType}
                                </td>
                                <td>
                                  {record.activity}
                                </td>
                                <td>
                                  {record.createdAt
                                    ? new Date(
                                        record.createdAt
                                      ).toLocaleString()
                                    : "Unknown"}
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </>
        )}
        {/* PRINT REPORT */}
        <button
          type="button"
          className="reports-print-button"
          onClick={printReport}
          disabled={
            !activeReport ||
            loading ||
            Boolean(error)
          }
          title={
            !activeReport
              ? "Select a report to print"
              : "Print this report"
          }
        >
          <FiPrinter />
          Print Report
        </button>
      </main>
    </div>
  );
}
