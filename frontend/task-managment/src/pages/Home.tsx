import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/team-ui.css";

export default function Home() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="tm-home-shell">
      <div className="tm-home-card">
        <p className="tm-brand">Task Management</p>
        <h1>Control center</h1>
        <p>Create and manage teams from one place.</p>
        <div className="tm-home-actions">
          <button type="button" className="tm-primary-btn" onClick={() => navigate("/teams")}>
            Create team
          </button>
          <button type="button" className="tm-ghost-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
