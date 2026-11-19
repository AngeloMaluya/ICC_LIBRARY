import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";

import "./dashboard.css";

const PROGRAMS = [
  { code: "BSCS", name: "Bachelor of Science in Computer Science" },
  { code: "BSBA", name: "Bachelor of Science in Business Administration" },
  { code: "BSED", name: "Bachelor of Secondary Education" },
  { code: "BEED", name: "Bachelor of Elementary Education" },
  { code: "BSTM", name: "Bachelor of Science in Tourism Management" },
  { code: "BSCrim", name: "Bachelor of Science in Criminology" },
];


const SHS_PROGRAMS = [
  { code: "STEM", name: "Science, Technology, Engineering, and Mathematics" },
  { code: "ABM", name: "Accountancy, Business and Management" },
  { code: "HUMSS", name: "Humanities and Social Sciences" },
  { code: "GAS", name: "General Academic Strand" },
  { code: "HE", name: "Home Economics" },
  { code: "ICT", name: "Information and Communications Technology" },
];

const ProgramChart = ({ title, description, data, navigate }) => {
  const handleBarClick = (entry) => {
    const program = entry?.payload ?? entry;

    if (!program?.code || !program?.level) return;

    navigate(
      `/program?level=${program.level}&program=${encodeURIComponent(
        program.code
      )}`
    );
  };

const highestCount = Math.max(
  0,
  ...data.map((program) => program.count)
);

const axisMax =
  Math.floor((highestCount + 10) / 20) * 20 + 10;

  return (
    <section className="admin-collection-section">
      <div className="admin-collection-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="admin-chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            layout="vertical"
            accessibilityLayer={false}
            margin={{
              top: 10,
              right: 45,
              left: 15,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
            />

            <YAxis
              type="number"
              domain={[0, axisMax]}
              ticks={Array.from(
                { length: Math.floor(axisMax / 10) + 1 },
                (_, i) => i * 10
              )}
              allowDecimals={false}
            />

            <XAxis
              dataKey="code"
              type="category"
              width={75}
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              formatter={(value) => [
                value,
                "Research Papers",
              ]}
              labelFormatter={(code) =>
                data.find((p) => p.code === code)?.name || code
              }
            />

            <Bar
              dataKey="count"
              fill="#0D4B8E"
              radius={[0, 5, 5, 0]}
              maxBarSize={30}
              cursor="pointer"
              onClick={handleBarClick}
            >
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};


const Dashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

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
          path: "/reports?report=collection",
        },
        {
          title: "Total Views",
          value: stats.totalViews,
          description: "Research PDF views",
          path: "/reports?report=viewing",
        },
        {
          title: "Cite Actions",
          value: stats.totalCitations,
          description: "Citation tool uses",
          path: "/reports?report=citations",
        },
        {
          title: "Total Users",
          value: stats.totalUsers ?? stats.totalStudents,
          description: "Registered accounts",
          path: "/reports?report=accounts",
        },
      ];

  /* =========================================
     RESEARCH COLLECTION PER PROGRAM
  ========================================= */
  const collegeData = PROGRAMS.map((program) => ({
    ...program,
    count: Number(programCounts[program.code] ?? 0),
    level: "college",
  })).sort((a, b) => b.count - a.count);

  const shsData = SHS_PROGRAMS.map((program) => ({
    ...program,
    count: Number(programCounts[program.code] ?? 0),
    level: "shs",
  })).sort((a, b) => b.count - a.count);

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
          <button
            type="button"
            className="admin-stat-card"
            key={stat.title}
            onClick={() => navigate(stat.path)}
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
          </button>
        ))}
      </section>
            {/* =====================================
                COLLEGE RESEARCH COLLECTION
            ===================================== */}

            {error ? (
              <p className="admin-dashboard-message">{error}</p>
            ) : (
              <>
                <ProgramChart
                  title="Research Collection per College Program"
                  description="Number of uploaded research documents grouped by college program."
                  data={collegeData}
                  navigate={navigate}
                />

                {/* =====================================
                    SENIOR HIGH SCHOOL COLLECTION
                ===================================== */}

                <ProgramChart
                  title="Research Collection per SHS Strand"
                  description="Number of uploaded research documents grouped by Senior High School strand."
                  data={shsData}
                  navigate={navigate}
                />
              </>
            )}

</div>
</main>
</div>
  );
};

export default Dashboard;