import { Navigate } from "react-router-dom";

const GoogleProtectedRoute = ({ children }) => {
  // Get the logged-in user from the current browser session
  const libraryUser = JSON.parse(
    sessionStorage.getItem("libraryUser") || "null"
  );

  // Get the temporary Google email used during profile creation
  const googleEmail = sessionStorage.getItem("googleEmail");

  // Allow users with a valid authenticated account
  if (
    libraryUser &&
    libraryUser.id !== undefined &&
    libraryUser.id !== null &&
    libraryUser.email
  ) {
    return children;
  }

  // Allow Google school accounts during profile creation
  if (googleEmail?.endsWith("@immaculada.edu.ph")) {
    return children;
  }

  // Redirect unauthorized users
  return <Navigate to="/" replace />;
};

export default GoogleProtectedRoute;
