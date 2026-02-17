import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import TeamPage from "./pages/TeamPage";
import ProjectPage from "./pages/ProjectPage";

function Loading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <p style={{ fontSize: 18, color: "#475569" }}>Loading…</p>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isReady } = useAuth();
  if (!isReady) return <Loading />;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, isReady } = useAuth();
  if (!isReady) return <Loading />;
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/teams" element={<PrivateRoute><TeamPage /></PrivateRoute>} />
      <Route path="/teams/:teamId/projects" element={<PrivateRoute><ProjectPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
