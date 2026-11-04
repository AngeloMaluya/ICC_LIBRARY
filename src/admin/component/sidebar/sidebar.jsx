
import { useNavigate } from "react-router-dom";
import Logo from "../../../assets/icon.png";

import {
  FaBookmark,
  FaSignOutAlt,
  FaUpload,
  FaGraduationCap,
} from "react-icons/fa";

import "./sidebar.css";

import { logout } from "../../../utils/auth.js";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  
  const user = sessionStorage.getItem("libraryUser");
  const isLoggedIn = !!user;

  const handleLogout = () => logout(navigate);

  return (
    <aside className="library-sidebar">
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
          <FaUpload />
          <span>Uploads</span>
        </button>


        <button
          type="button"
          onClick={() => navigate("/saved")}
          className="sidebar-item"
        >
          <FaBookmark />
          <span>Saved Reports</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/history")}
          className="sidebar-item"
        >
          <FaGraduationCap />
          <span>Programs</span>
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
