import { Navigate } from "react-router-dom";

const GoogleProtectedRoute = ({ children }) => {

  const googleEmail = localStorage.getItem("googleEmail");

  if (!googleEmail) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GoogleProtectedRoute;