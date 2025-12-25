import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  // Not logged in → kick to auth page
  if (!token) return <Navigate to="/auth" replace />;
  
  // Logged in → allow access
  return children;
}