
import { useState } from "react";
import { FaSearch } from "react-icons/fa";

import "./dashboard.css";

const Dashboard = () => {
  const [search, setSearch] = useState("");

  const stats = [
    {
      title: "Total Research",
      value: 97,
      change: "+35%",
    },
    {
      title: "Total Students",
      value: 0,
      change: "",
    },
    {
      title: "Total Programs",
      value: 6,
      change: "",
    },
    {
      title: "Total Uploads",
      value: 0,
      change: "",
    },
  ];

  const programs = [
    "BSCS",
    "BSBA",
    "BSED",
    "BEED",
    "BSTM",
  ];

  return (
    <div className="admin-dashboard-layout">

      <main className="admin-dashboard-main">
        {/* SEARCH BAR */}
        <div className="admin-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* STATISTICS SECTION */}
        <section className="admin-section">
          <div className="admin-stats-grid">
            {stats.map((stat, index) => (
              <div className="admin-stat-card" key={index}>
                <p>{stat.title}</p>
                <h2>{stat.value}</h2>

                {stat.change && (
                  <span className="admin-stat-change">
                    {stat.change}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* PROGRAM SECTION */}
        <section className="admin-section">
          <div className="admin-program-grid">
            {programs.map((program) => (
              <div
                className="admin-program-card"
                key={program}
              >
                <h3>{program}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* ACTIVITY SECTION */}
        <section className="admin-section admin-activity">
          <div className="admin-activity-header" />

          <div className="admin-activity-line" />
          <div className="admin-activity-line" />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
