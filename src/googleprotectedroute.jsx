import { Navigate } from "react-router-dom";

const GoogleProtectedRoute = ({ children }) => {
  const authToken = sessionStorage.getItem("authToken");
  const signupToken = sessionStorage.getItem("googleSignupToken");

  // Allow a new Google student to complete registration
  if (signupToken) {
    return children;
  }

  // Require a backend-issued token for student pages
  if (authToken) {
    return children;
  }

  return <Navigate to="/login" replace />;
};

export default GoogleProtectedRoute;