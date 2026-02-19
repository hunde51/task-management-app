import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProjectPage from "./pages/ProjectPage";
import Register from "./pages/Register";
import TeamPage from "./pages/TeamPage";
import { ProtectedRoute, PublicRoute } from "./routes/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/teams" element={<TeamPage />} />
        <Route path="/teams/:teamId/projects" element={<ProjectPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <AppRoutes />
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
