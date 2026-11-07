
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../../assets/icon.png";

import { FiLogOut } from "react-icons/fi";
import { GoUpload } from "react-icons/go";

import {
  FaRegUser,
  FaUser,
  FaHistory,
} from "react-icons/fa";

import "./sidebar.css";
import { logout } from "../../../utils/auth.js";

const menuItems = [
  {
    label: "Profile",
    icon: <FaRegUser />,
    activeIcon: <FaUser />,
    path: "/profile",
  },
  {
    label: "Uploads",
    icon: <GoUpload />,
    activeIcon: <GoUpload />,
    path: "/upload",
  },
  {
    label: "Programs",
    icon: <FaHistory />,
    className: "sidebar-history-icon",
    path: "/program",
  },
  {
    label: "Saved Reports",
    icon: <FaHistory />,
    className: "sidebar-history-icon",
    path: "/SavedReports",
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
          onClick={() => navigate("/dashboard")}
          aria-label="Go to Dashboard"
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
