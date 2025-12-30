import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  if (!token) return <Navigate to="/auth" replace />; // Not logged in → kick to auth page
  return children; // Logged in → allow access
}