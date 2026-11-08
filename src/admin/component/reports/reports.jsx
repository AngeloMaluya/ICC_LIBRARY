
import { useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiEye,
  FiUsers,
  FiPrinter,
} from "react-icons/fi";

import Sidebar from "../sidebar/sidebar.jsx";
import "./reports.css";

const REPORT_TYPES = [
  {
    id: "collection",
    title: "Research Collection Report",
    description: "List of uploaded research papers grouped by program.",
    icon: FiFileText,
  },
  {
    id: "viewing",
    title: "Research Viewing Report",
    description:
      "Record of research documents viewed and their view counts.",
    icon: FiEye,
  },
  {
    id: "activity",
    title: "User Activity Report",
    description:
      "Records of user activity within the repository.",
    icon: FiUsers,
  },
];

const PROGRAMS = [
  "BSCS",
  "BSBA",
  "BSED",
  "BEED",
  "BSTM",
  "BSCrim",
];

const INITIAL_FILTERS = {
  program: "",
  year: "",
  period: "",
  userType: "",
  activity: "",
  search: "",
  startDate: "",
  endDate: "",
};

export default function Reports() {
  const [activeReport, setActiveReport] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Replace these with data fetched from your backend.
  const [researches] = useState([]);
  const [viewingRecords] = useState([]);
  const [activityRecords] = useState([]);

  const updateFilter = (name, value) => {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openReport = (reportId) => {
    setFilters(INITIAL_FILTERS);
    setActiveReport(reportId);
  };

  const selectedReport = REPORT_TYPES.find(
    (report) => report.id === activeReport
  );

  const availableYears = useMemo(() => {
    return [...new Set(researches.map((r) => r.year))]
      .filter(Boolean)
      .sort((a, b) => Number(b) - Number(a));
  }, [researches]);

  const collectionData = useMemo(() => {
    return researches.filter((research) => {
      const matchesProgram =
        !filters.program || research.program === filters.program;

      const matchesYear =
        !filters.year ||
        String(research.year) === filters.year;

      const matchesSearch = (research.title || "")
        .toLowerCase()
        .includes(filters.search.toLowerCase());

      return matchesProgram && matchesYear && matchesSearch;
    });
  }, [researches, filters]);

  const viewingData = useMemo(() => {
    return viewingRecords
      .filter((record) => {
        const matchesProgram =
          !filters.program || record.program === filters.program;

        const matchesSearch = (record.title || "")
          .toLowerCase()
          .includes(filters.search.toLowerCase());

        const recordDate = record.lastViewedAt
          ? new Date(record.lastViewedAt)
          : null;

        const now = new Date();

        const matchesPeriod =
          !filters.period ||
          (recordDate &&
            !Number.isNaN(recordDate.getTime()) &&
            (() => {
              const days = Number(filters.period);
              const cutoff = new Date(now);
              cutoff.setDate(cutoff.getDate() - days);
              return recordDate >= cutoff && recordDate <= now;
            })());

        return matchesProgram && matchesSearch && matchesPeriod;
      })
      .sort((a, b) => (b.views || 0) - (a.views || 0));
  }, [viewingRecords, filters]);

  const activityData = useMemo(() => {
    return activityRecords.filter((record) => {
      const matchesType =
        !filters.userType || record.userType === filters.userType;

      const matchesActivity =
        !filters.activity || record.activity === filters.activity;

      const matchesSearch =
        `${record.user || ""} ${record.activity || ""}`
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const date = record.createdAt
        ? new Date(record.createdAt)
        : null;

      const matchesStart =
        !filters.startDate ||
        (date &&
          !Number.isNaN(date.getTime()) &&
          date >= new Date(`${filters.startDate}T00:00:00`));

      const matchesEnd =
        !filters.endDate ||
        (date &&
          !Number.isNaN(date.getTime()) &&
          date <= new Date(`${filters.endDate}T23:59:59`));

      return (
        matchesType &&
        matchesActivity &&
        matchesSearch &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [activityRecords, filters]);

  const printReport = () => {
    window.print();
  };

  const FilterSelect = ({ label, name, options }) => (
    <label className="report-filter">
      <span>{label}</span>
      <select
        value={filters[name]}
        onChange={(event) =>
          updateFilter(name, event.target.value)
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );

  const programOptions = [
    { value: "", label: "All Programs" },
    ...PROGRAMS.map((program) => ({
      value: program,
      label: program,
    })),
  ];

  return (
    <div className="admin-reports-layout">
      <div className="reports-sidebar">
        <Sidebar />
      </div>

      <main className="reports-main">
        {!activeReport ? (
          <>
            <header className="reports-page-header">
              <h1>Reports</h1>
              <p>
                Generate and manage library research repository reports.
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
                      onClick={() => openReport(report.id)}
                    >
                      <Icon className="reports-option-icon" />

                      <span className="reports-option-text">
                        <strong>{report.title}</strong>
                        <small>{report.description}</small>
                      </span>

                      <FiChevronRight className="reports-option-arrow" />
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="reports-page-header reports-detail-header">
              <button
                type="button"
                className="reports-back-button"
                onClick={() => setActiveReport(null)}
                aria-label="Back to reports"
              >
                <FiChevronLeft />
              </button>

              <div>
                <h1>{selectedReport.title}</h1>
                <p>
                  {activeReport === "collection"
                    ? "Immaculada Concepcion College - Research Repository"
                    : selectedReport.description}
                </p>
              </div>
            </header>

            <section className="reports-detail">
              <h2>Report Filters</h2>

              {activeReport === "collection" && (
                <>
                  <div className="reports-filter-grid">
                    <FilterSelect
                      label="Academic Program"
                      name="program"
                      options={programOptions}
                    />

                    <FilterSelect
                      label="Year"
                      name="year"
                      options={[
                        { value: "", label: "All Years" },
                        ...availableYears.map((year) => ({
                          value: String(year),
                          label: String(year),
                        })),
                      ]}
                    />
                  </div>

                  <input
                    className="reports-search"
                    placeholder="Search Research Title"
                    value={filters.search}
                    onChange={(e) =>
                      updateFilter("search", e.target.value)
                    }
                  />

                  <h2 className="reports-data-heading">
                    Uploaded Research
                  </h2>

                  <div className="reports-collection-list">
                    {collectionData.length === 0 ? (
                      <p className="reports-empty">
                        No research records found.
                      </p>
                    ) : (
                      collectionData.map((research) => (
                        <div
                          className="reports-research-row"
                          key={research.id}
                        >
                          <div>
                            <strong>{research.title}</strong>
                            <small>{research.program}</small>
                          </div>

                          <div className="reports-research-meta">
                            <span>{research.year}</span>
                            <span className="reports-admin-tag">
                              {research.uploadedBy || "Admin"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {activeReport === "viewing" && (
                <>
                  <div className="reports-filter-grid">
                    <FilterSelect
                      label="Academic Program"
                      name="program"
                      options={programOptions}
                    />

                    <FilterSelect
                      label="Time Period"
                      name="period"
                      options={[
                        { value: "", label: "All Time" },
                        { value: "7", label: "Last 7 Days" },
                        { value: "30", label: "Last 30 Days" },
                        { value: "365", label: "Last Year" },
                      ]}
                    />
                  </div>

                  <input
                    className="reports-search"
                    placeholder="Search Research Title"
                    value={filters.search}
                    onChange={(e) =>
                      updateFilter("search", e.target.value)
                    }
                  />

                  <div className="reports-table-container">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Research Title</th>
                          <th>Program</th>
                          <th>Views</th>
                        </tr>
                      </thead>

                      <tbody>
                        {viewingData.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="reports-table-empty">
                              No viewing records found.
                            </td>
                          </tr>
                        ) : (
                          viewingData.map((record, index) => (
                            <tr key={record.id}>
                              <td>{index + 1}</td>
                              <td>{record.title}</td>
                              <td>{record.program}</td>
                              <td>{record.views}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeReport === "activity" && (
                <>
                  <div className="reports-filter-grid">
                    <FilterSelect
                      label="User Type"
                      name="userType"
                      options={[
                        { value: "", label: "All User Types" },
                        { value: "student", label: "Student" },
                        { value: "admin", label: "Admin" },
                      ]}
                    />

                    <FilterSelect
                      label="Activity"
                      name="activity"
                      options={[
                        { value: "", label: "All Activities" },
                        { value: "Login", label: "Login" },
                        { value: "View Research", label: "View Research" },
                        { value: "Upload Research", label: "Upload Research" },
                        { value: "Logout", label: "Logout" },
                      ]}
                    />
                  </div>

                  <input
                    className="reports-search"
                    placeholder="Search user email or activity..."
                    value={filters.search}
                    onChange={(e) =>
                      updateFilter("search", e.target.value)
                    }
                  />

                  <div className="reports-filter-grid">
                    <label className="report-filter">
                      <span>Start Date</span>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                          updateFilter("startDate", e.target.value)
                        }
                      />
                    </label>

                    <label className="report-filter">
                      <span>End Date</span>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                          updateFilter("endDate", e.target.value)
                        }
                      />
                    </label>
                  </div>

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
                        {activityData.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="reports-table-empty">
                              No user activity records found.
                            </td>
                          </tr>
                        ) : (
                          activityData.map((record) => (
                            <tr key={record.id}>
                              <td>{record.user}</td>
                              <td>{record.userType}</td>
                              <td>{record.activity}</td>
                              <td>
                                {new Date(
                                  record.createdAt
                                ).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <button
                type="button"
                className="reports-print-button"
                onClick={printReport}
              >
                <FiPrinter />
                Print Report
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
