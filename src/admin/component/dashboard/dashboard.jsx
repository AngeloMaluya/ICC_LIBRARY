import { useEffect, useState } from "react";
import "./dashboard.css";

const PROGRAMS = [
  { code: "BSCS", name: "BS Computer Science" },
  { code: "BSBA", name: "BS Business Administration" },
  { code: "BSED", name: "BS Secondary Education" },
  { code: "BEED", name: "Bachelor of Elementary Education" },
  { code: "BSTM", name: "BS Tourism Management" },
  { code: "BSCrim", name: "BS Criminology" },
  { code: "STEM", name: "STEM" },
  { code: "ABM", name: "ABM" },
  { code: "HUMSS", name: "HUMSS" },
  { code: "GAS", name: "GAS" },
  { code: "HE", name: "Home Economics" },
  { code: "ICT", name: "ICT" },
];

const Dashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  /* =========================================
     DASHBOARD STATE
  ========================================= */

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalResearch: 0,
      totalStudents: 0,
      totalUsers: 0,
      totalPrograms: 0,
      totalUploads: 0,
      totalViews: 0,
      totalCitations: null,
    },
    programCounts: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================
     FETCH DASHBOARD STATISTICS
  ========================================= */

  useEffect(() => {
    document.title = "Admin Dashboard";

    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("authToken");

        if (!token) {
          throw new Error("Please log in again.");
        }

        const response = await fetch(
          `${API_URL}/api/dashboard/stats`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load dashboard."
          );
        }

        if (!controller.signal.aborted) {
          setDashboardData(data);
        }
      } catch (err) {
        if (
          err.name === "AbortError" ||
          controller.signal.aborted
        ) {
          return;
        }

        console.error("DASHBOARD FETCH ERROR:", err);

        setError(
          err.message || "Unable to load dashboard."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => controller.abort();
  }, [API_URL]);

  /* =========================================
     DASHBOARD DATA
  ========================================= */

  const {
    stats = {},
    programCounts = {},
  } = dashboardData;

  /* =========================================
     STATISTICS CARDS
  ========================================= */

  const statistics = [
    {
      title: "Total Research",
      value: stats.totalResearch,
      description: "Stored research documents",
    },
    {
      title: "Total Views",
      value: stats.totalViews,
      description: "Research PDF views",
    },
    {
      title: "Cite Actions",
      value: stats.totalCitations,
      description: "Citation tool uses",
    },
    {
      title: "Total Users",
      value: stats.totalUsers ?? stats.totalStudents,
      description: "Registered accounts",
    },
  ];

  /* =========================================
     RESEARCH COLLECTION PER PROGRAM
  ========================================= */

  const programData = PROGRAMS.map((program) => ({
    ...program,
    count: Number(programCounts[program.code] ?? 0),
  }));

  const maxCount = Math.max(
    ...programData.map((program) => program.count),
    1
  );

  /* =========================================
     FORMAT STATISTICS
  ========================================= */

  const formatValue = (value) => {
    if (loading) {
      return "...";
    }

    if (
      error ||
      value === undefined ||
      value === null
    ) {
      return "—";
    }

    return Number(value).toLocaleString();
  };

  /* =========================================
     DASHBOARD UI
  ========================================= */

  return (
    <div className="admin-dashboard-layout">
      <main className="admin-dashboard-main">
        <div className="admin-dashboard-content">

          {/* =====================================
              DASHBOARD STATISTICS
          ===================================== */}

          <section className="admin-stats-grid">
            {statistics.map((stat) => (
              <div
                className="admin-stat-card"
                key={stat.title}
              >
                <div className="admin-stat-top">
                  <h2>
                    {formatValue(stat.value)}
                  </h2>

                  <span>
                    {stat.title}
                  </span>
                </div>

                <p>
                  {stat.description}
                </p>
              </div>
            ))}
          </section>

          {/* =====================================
              RESEARCH COLLECTION
          ===================================== */}

          <section className="admin-collection-section">

            <div className="admin-collection-heading">
              <h2>
                Research Collection per Program/Strand
              </h2>

              <p>
                Number of uploaded research documents
                grouped by academic program or strand.
              </p>
            </div>

            {error ? (
              <p className="admin-dashboard-message">
                {error}
              </p>
            ) : (
              <div className="admin-program-list">

                {programData.map((program) => (
                  <div
                    className="admin-program-row"
                    key={program.code}
                  >

                    {/* PROGRAM NAME AND COUNT */}

                    <div className="admin-program-label">
                      <span>
                        {program.name}
                      </span>

                      <strong>
                        {loading
                          ? "..."
                          : program.count.toLocaleString()}
                      </strong>
                    </div>

                    {/* PROGRAM PROGRESS BAR */}

                    <div className="admin-progress-track">
                      <div
                        className="admin-progress-fill"
                        style={{
                          width: loading
                            ? "0%"
                            : `${
                                (program.count / maxCount) * 100
                              }%`,
                        }}
                      />
                    </div>

                  </div>
                ))}

              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;