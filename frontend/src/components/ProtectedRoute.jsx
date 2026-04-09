import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { normalizeUserRole } from "../utils/roles";

function resolveDashboardPath(role) {
  const r = normalizeUserRole(role);
  if (r === "user") return "/user";
  if (r === "volunteer") return "/volunteer";
  return "/";
}

/**
 * Protects pages based on authentication state and optional role.
 * - If not logged in: redirect to login.
 * - If token exists but role is missing: treat as bad session → login.
 * - If wrong role: redirect to the correct dashboard.
 */
function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  // Prevent infinite redirect loops
  const currentPath = location.pathname;
  const isOnCorrectDashboard = 
    (allowedRole === "user" && currentPath === "/user") ||
    (allowedRole === "volunteer" && currentPath === "/volunteer");

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRole && !role) {
    return <Navigate to="/" replace />;
  }

  const normalizedRole = normalizeUserRole(role);
  const normalizedAllowed = normalizeUserRole(allowedRole);
  if (allowedRole && normalizedRole && normalizedAllowed !== normalizedRole && !isOnCorrectDashboard) {
    return <Navigate to={resolveDashboardPath(role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
