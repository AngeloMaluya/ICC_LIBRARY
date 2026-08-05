import { useEffect } from "react";
import "./base.css";
import Logo from "../assets/icon.png";
import { FaBars, FaBell, FaSearch, FaUserCircle } from "react-icons/fa";

export const Library = () => {
  useEffect(() => {
    document.title = "Library Management System";
  }, []);

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
          <button>BSCS</button>
          <button>BSED</button>
          <button>BEED</button>
          <button>BSCrim</button>
          <button>BSTM</button>
        </div>

      </main>

    </div>
  );
};

export default Library;