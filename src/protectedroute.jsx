import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const libraryUser = localStorage.getItem("libraryUser");

  if (!libraryUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;