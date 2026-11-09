
import { Navigate, Outlet } from "react-router-dom";

const StudentProtectedRoute = () => {
  const token = sessionStorage.getItem("authToken");
  const storedUser = sessionStorage.getItem("libraryUser");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "student") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default StudentProtectedRoute;
