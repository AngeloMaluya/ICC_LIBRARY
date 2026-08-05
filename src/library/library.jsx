import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./base_lib.css";
import Logo from "../assets/icon.png";
import { FaBars, FaBell, FaSearch, FaUserCircle } from "react-icons/fa";

export const Library = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Library Management System";
  }, []);

  const programs = [
    "BSCS",
    "BSED",
    "BEED",
    "BSCrim",
    "BSTM",
  ];

  return (
    <div className="library">

     
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


      <main className="hero">

        <h1>What research are you looking for?</h1>

        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search books, thesis, journals..."
          />
        </div>

       <div className="categories">
          {programs.map((program) => (
            <button
              key={program}
              onClick={() => navigate(`/library/${program}`)}
            >
              {program}
            </button>
          ))}
        </div>

        {/* Recommended Section */}
        <div className="recommend-section">
          <h2>Recommended</h2>

          <div className="card-container">
            {[1, 2, 3, 4, 5].map((card) => (
              <div className="research-card" key={card}>
                <div className="card-image"></div>

                <div className="card-info">
                  <h3>Sample Research {card}</h3>
                  <p>Author Name</p>
                  <small>2025</small>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

    </div>
  );
};

export default Library;