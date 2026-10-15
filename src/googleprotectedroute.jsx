import { Navigate } from "react-router-dom";

const GoogleProtectedRoute = ({ children }) => {
  const googleEmail = localStorage.getItem("googleEmail");

  const libraryUser = JSON.parse(
    localStorage.getItem("libraryUser") || "null"
  );

  // Allow demo user, registered users, and admin
  if (
    libraryUser?.id === "user" ||
    libraryUser?.role === "user" ||
    libraryUser?.role === "admin"
  ) {
    return children;
  }

  // Allow Google school email accounts
  if (googleEmail?.endsWith("@immaculada.edu.ph")) {
    return children;
  }

  // Redirect unauthorized users
  return <Navigate to="/" replace />;
};

export default GoogleProtectedRoute;