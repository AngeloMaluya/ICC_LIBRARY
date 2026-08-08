import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./base_lib.css";
import Logo from "../assets/icon.png";
import { FaBars, FaBell, FaSearch, FaUserCircle } from "react-icons/fa";

export const Program = () => {
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { program } = useParams();

  const [search, setSearch] = useState("");

  const researchData = [
    {
      id: 1,
      title: "Library Management System",
      author: "Juan Dela Cruz",
      year: "2024",
      program: "BSCS",
    },
    {
      id: 2,
      title: "Online Enrollment System",
      author: "Maria Santos",
      year: "2023",
      program: "BSCS",
    },
    {
      id: 3,
      title: "Teaching Strategies",
      author: "Pedro Cruz",
      year: "2022",
      program: "BSED",
    },
    {
      id: 4,
      title: "Child Psychology",
      author: "Anna Reyes",
      year: "2024",
      program: "BEED",
    },
    {
      id: 5,
      title: "Hotel Reservation System",
      author: "James Lee",
      year: "2023",
      program: "BSTM",
    },
    {
      id: 6,
      title: "Crime Mapping System",
      author: "Karl Reyes",
      year: "2024",
      program: "BSCrim",
    },
  ];

  const programs = [
    "BSCS",
    "BSED",
    "BEED",
    "BSTM",
    "BSCrim",
  ];

  const filteredResearch = researchData.filter(
    (item) =>
      item.program === program &&
      item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
  <div className="library">
  
    {/* Header */}
    <header className="navbar">
      <div className="nav-left">
        <FaBars className="menu-icon" />

        <img src={Logo} alt="Logo" className="logo" />

        <div className="school">
          <h3>Immaculada Concepcion College</h3>
        </div>
      </div>

      <div className="nav-right">
        <FaBell className="icon" />
        <FaUserCircle className="profile" />
      </div>
    </header>

    {/* Title */}
    <h1 style={{ textAlign: "center", color: "#184E9E", marginTop: "30px" }}>
      {program} Research Library
    </h1>

    {/* Search */}
    <div style={{ textAlign: "center", margin: "30px" }}>
      <input
        type="text"
        placeholder="Search Research..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "450px",
          height: "45px",
          borderRadius: "30px",
          border: "none",
          paddingLeft: "20px",
          background: "#e8e8e8",
        }}
      />
    </div>

    {/* Program Buttons */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "15px",
        marginBottom: "40px",
      }}
    >
      {programs.map((item) => (
        <button
          key={item}
          onClick={() => navigate(`/library/${item}`)}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            background: item === program ? "#184E9E" : "#FFE7A5",
            color: item === program ? "white" : "black",
          }}
        >
          {item}
        </button>
      ))}
    </div>

    {/* Cards */}
    <div
      style={{
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {filteredResearch.length > 0 ? (
        filteredResearch.map((item) => (
          <div
            key={item.id}
            style={{
              width: "200px",
              background: "white",
              borderRadius: "10px",
              padding: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,.15)",
            }}
          >
            <div
              style={{
                height: "180px",
                background: "#0D4F8B",
                borderRadius: "5px",
              }}
            />

            <h3>{item.title}</h3>

            <p>{item.author}</p>

            <small>{item.year}</small>
          </div>
        ))
      ) : (
        <h3>No research found.</h3>
      )}
    </div>
  </div>
);
}

export default Program;