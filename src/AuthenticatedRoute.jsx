
import { Navigate, Outlet } from "react-router-dom";

const AuthenticatedRoute = () => {
  const token = sessionStorage.getItem("authToken");
  const storedUser = sessionStorage.getItem("libraryUser");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  // Redirect users without a session
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Allow only recognized roles
  if (!["student", "admin"].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AuthenticatedRoute;
