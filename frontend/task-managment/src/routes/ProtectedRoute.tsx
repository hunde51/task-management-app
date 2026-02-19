import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { token, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="route-loading">
        <p>Loading session...</p>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicRoute() {
  const { token, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="route-loading">
        <p>Loading session...</p>
      </div>
    );
  }

  if (token) return <Navigate to="/" replace />;
  return <Outlet />;
}
