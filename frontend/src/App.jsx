import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import VolunteerDashboardPage from "./pages/VolunteerDashboardPage";
import MissionModePage from "./pages/MissionModePage";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuth from "./hooks/useAuth";
import { normalizeUserRole } from "./utils/roles";

function HomeRoute() {
  const { isAuthenticated, role, clearToken } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !role) {
      clearToken();
    }
  }, [isAuthenticated, role, clearToken]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!role) {
    return <LoginPage />;
  }

  if (normalizeUserRole(role) === "volunteer") {
    return <Navigate to="/volunteer" replace />;
  }

  return <Navigate to="/user" replace />;
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />}
      />
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRole="user">
            <UserDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer"
        element={
          <ProtectedRoute allowedRole="volunteer">
            <VolunteerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mission"
        element={
          <ProtectedRoute allowedRole="volunteer">
            <MissionModePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
