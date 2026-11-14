
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar.jsx";
import "./AdminLayout.css";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Sidebar role="admin" />

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
