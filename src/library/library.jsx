import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./base_lib.css";
import Logo from "../assets/icon.png";
import {
  FaBars,
  FaBell,
  FaSearch,
  FaUserCircle,
} from "react-icons/fa";

export const Library = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Library Management System";
  }, []);

  const programs = [
    "BSCS",
    "BSBA",
    "BSED",
    "BEED",
    "BSTM",
    "BSCrim",
  ];

  const researches = [
    {
      id: 1,
      title: "Sample Research 1",
      author: "Author Name",
      year: "2025",
    },
    {
      id: 2,
      title: "Sample Research 2",
      author: "Author Name",
      year: "2025",
    },
    {
      id: 3,
      title: "Sample Research 3",
      author: "Author Name",
      year: "2025",
    },
    {
      id: 4,
      title: "Sample Research 4",
      author: "Author Name",
      year: "2025",
    },
    {
      id: 5,
      title: "Sample Research 5",
      author: "Author Name",
      year: "2025",
    },
  ];

  return (
    <div className="library">

      

      <main className="hero">

        <h1>What research are you looking for?</h1>


        <div className="search-box">
          <FaSearch className="search-icon" />

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

        <div className="recommend-section">

          <div className="card-container">

            {researches.map((research) => (
              <div
                className="research-card"
                key={research.id}
              >
                <div className="card-image"></div>

                <div className="card-info">

                  <h3>
                    {research.title}
                  </h3>

                  <p>
                    {research.author}
                  </p>

                  <small>
                    {research.year}
                  </small>

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