
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../assets/icon.png";

import { FiLogOut } from "react-icons/fi";

import {
  FaRegUser,
  FaUser,
  FaRegBookmark,
  FaBookmark,
  FaHistory,
} from "react-icons/fa";

import "./sidebar.css";
import { logout } from "../../utils/auth.js";

const menuItems = [
  {
    label: "Profile",
    icon: <FaRegUser />,
    activeIcon: <FaUser />,
    path: "/profile",
  },
  {
    label: "Saved",
    icon: <FaRegBookmark />,
    activeIcon: <FaBookmark />,
    path: "/saved",
  },
  {
    label: "Viewing History",
    icon: <FaHistory />,
    className: "sidebar-history-icon",
    path: "/history",
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

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
        {menuItems.map((item) => {
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`sidebar-item ${active ? "active" : ""}`}
            >
              <span className={`sidebar-icon ${item.className || ""}`}>
                <span className="icon-default">
                  {active ? item.activeIcon || item.icon : item.icon}
                </span>

                <span className="icon-hover">
                  {item.activeIcon || item.icon}
                </span>
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-item"
        >
          <span className="sidebar-icon">
            <FiLogOut />
          </span>
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
