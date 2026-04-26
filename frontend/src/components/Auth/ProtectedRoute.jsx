import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  // useLocation is used to get the current location
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // if the user is loading, return null
  if (loading) return null;
  // if the user is not logged in, redirect to the login page
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  return children;
}