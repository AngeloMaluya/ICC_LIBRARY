import { useNavigate } from "react-router-dom";
import Logo from "../../assets/icon.png";

import {
  FaUser,
  FaRegBookmark,
  FaHistory,
  FaSignOutAlt,
} from "react-icons/fa";

import "./sidebar.css";
import { logout } from "../../utils/auth.js";

const Sidebar = () => {
  const navigate = useNavigate();

  const user = localStorage.getItem("libraryUser");
  const isLoggedIn = !!user;

  const handleLogout = () => logout(navigate);

  return (
    <aside className="library-sidebar">

      {/* BRAND */}

      <div className="sidebar-brand">

        <button
          type="button"
          className="logo-button"
          onClick={() => navigate("/library")}
          aria-label="Go to Library"
        >
          <img
            src={Logo}
            alt="ICC Logo"
            className="sidebar-logo"
          />
        </button>

        <div className="brand-text">
          <strong>ICC</strong>
          <span>LIBRARY</span>
        </div>

      </div>


      {/* MENU */}

      <nav className="sidebar-menu">

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="sidebar-item"
        >
          <FaUser />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/saved")}
          className="sidebar-item"
        >
          <FaRegBookmark />
          <span>Saved</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/history")}
          className="sidebar-item"
        >
          <FaHistory />
          <span>Viewing History</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-item"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </nav>

    </aside>
  );
};

export default Sidebar;
