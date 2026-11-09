
import { Navigate } from "react-router-dom";

const GoogleProtectedRoute = ({ children }) => {
  const signupToken = sessionStorage.getItem(
    "googleSignupToken"
  );

  if (!signupToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default GoogleProtectedRoute;
