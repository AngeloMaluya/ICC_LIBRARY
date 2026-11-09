
import { Navigate, Outlet } from "react-router-dom";

const GoogleProtectedRoute = () => {
  // Check for the temporary Google signup token
  const signupToken = sessionStorage.getItem("googleSignupToken");

  // Redirect users who haven't completed Google verification
  if (!signupToken) {
    return <Navigate to="/login" replace />;
  }

  // Display the protected Create Account page
  return <Outlet />;
};

export default GoogleProtectedRoute;
