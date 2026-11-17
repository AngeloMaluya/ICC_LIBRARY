import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../assets/icon.png";

import { FiLogOut } from "react-icons/fi";
import { GoUpload } from "react-icons/go";
import { GiGraduateCap } from "react-icons/gi";

import { IoLibraryOutline, IoLibrary } from "react-icons/io5";

import { TbLayoutDashboard, TbLayoutDashboardFilled  } from "react-icons/tb";

import {
  FaRegUser,
  FaUser,
  FaRegBookmark,
  FaBookmark,
  FaHistory,
  FaRegFolderOpen,
  FaFolderOpen,
} from "react-icons/fa";

import "./sidebar.css";
import { logout } from "../../utils/auth.js";
import { FaRegFolderClosed } from "react-icons/fa6";

// Student navigation menu
const studentMenu = [
  {
    label: "Library",
    icon: <IoLibraryOutline/>,
    activeIcon: <IoLibrary/>,
    path: "/library"
  },
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

// Admin navigation menu
const adminMenu = [
  {
    label: "Dashboard",
    icon: <TbLayoutDashboard />,
    activeIcon: <TbLayoutDashboardFilled />,
    path: "/dashboard",
  },
  {
    label: "Uploads",
    icon: <GoUpload />,
    activeIcon: <GoUpload />,
    path: "/upload",
  },
  {
    label: "Reports",
    icon: <FaHistory />,
    className: "sidebar-history-icon",
    path: "/reports",
  },
  {
    label: "Programs",
    icon: <GiGraduateCap />,
    path: "/program",
  },
  {
    label: "Catalog",
    icon: <FaRegFolderClosed />,
    activeIcon: <FaRegFolderOpen/>,
    path: "/program",
  },
];

const Sidebar = ({ role = "student" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which sidebar menu to display
  const isAdmin = role === "admin";
  const menuItems = isAdmin ? adminMenu : studentMenu;

  // Set the home page based on user role
  const homePath = isAdmin ? "/dashboard" : "/library";

  // Check whether a menu item matches the current route
  const isActive = (path) => location.pathname === path;

  // Log out and redirect to the login page
  const handleLogout = () => logout(navigate);

  return (
    <aside className="library-sidebar">
      {/* Sidebar logo and branding */}
      <div className="sidebar-brand">
       
          <img
            src={Logo}
            alt="ICC Logo"
            className="sidebar-logo"
          />
     

        <div className="brand-text">
          <strong>ICC CRID</strong>
        </div>
      </div>

      {/* Sidebar navigation links */}
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
              <span
                className={`sidebar-icon ${item.className || ""}`}
              >
                <span className="icon-default">
                  {active
                    ? item.activeIcon || item.icon
                    : item.icon}
                </span>

                <span className="icon-hover">
                  {item.activeIcon || item.icon}
                </span>
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Logout button */}
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
