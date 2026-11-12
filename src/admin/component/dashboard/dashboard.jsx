
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";

import "./dashboard.css";

const PROGRAMS = [
  "BSCS", "BSBA", "BSED", "BEED", "BSTM", "BSCrim"
];

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalResearch: 0,
      totalStudents: 0,
      totalPrograms: 0,
      totalUploads: 0,
    },
    programCounts: {},
  });

  const API_URL = import.meta.env.VITE_API_URL;

  // Load statistics from the backend
  useEffect(() => {
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
        if (err.name === "AbortError") return;

        console.error("DASHBOARD FETCH ERROR:", err);
        setError(err.message || "Unable to load dashboard.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => controller.abort();
  }, [API_URL]);

  const { stats, programCounts } = dashboardData;

  // Build dashboard statistic cards
  const statistics = [
    {
      title: "Total Research",
      value: stats.totalResearch,
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
    },
    {
      title: "Total Programs",
      value: stats.totalPrograms,
    },
    {
      title: "Total Uploads",
      value: stats.totalUploads,
    },
  ];

  // Filter program cards using the search field
  const filteredPrograms = PROGRAMS.filter((program) =>
    program.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-dashboard-layout">
      <main className="admin-dashboard-main">

        {/* STATISTICS SECTION */}
        <section className="admin-section">
          <div className="admin-stats-grid">
            {statistics.map((stat) => (
              <div
                className="admin-stat-card"
                key={stat.title}
              >
                <p>{stat.title}</p>

                <h2>
                  {loading ? "..." : error ? "—" : stat.value}
                </h2>
              </div>
            ))}
          </div>
        </section>

        {/* PROGRAM SECTION */}
        <section className="admin-section">
          <div className="admin-program-grid">
            {filteredPrograms.map((program) => (
              <div
                className="admin-program-card"
                key={program}
              >
                <div className="admin-program-info">
                  <h3>{program}</h3>

                  <p>
                    {loading
                      ? "Loading..."
                      : error
                      ? "Unavailable"
                      : `${programCounts[program] ?? 0} Research`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
