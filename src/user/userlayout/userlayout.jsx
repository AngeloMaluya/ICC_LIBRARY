import { Outlet } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import "./userlayout.css";

// Shared layout for all student pages
const UserLayout = () => {
  return (
    <div className="user-layout">
      <Sidebar role="student" />

      <main className="user-main">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
