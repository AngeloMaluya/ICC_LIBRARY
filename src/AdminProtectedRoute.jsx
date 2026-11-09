
import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedRoute = () => {
  const token = sessionStorage.getItem("authToken");
  const storedUser = sessionStorage.getItem("libraryUser");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  // No login session
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but not an administrator
  if (user.role !== "admin") {
    return <Navigate to="/library" replace />;
  }

  // Allow administrator pages
  return <Outlet />;
};

export default AdminProtectedRoute;
