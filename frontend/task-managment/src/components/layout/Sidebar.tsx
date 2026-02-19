import { NavLink } from "react-router-dom";

import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ThemeToggle from "../ui/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../hooks/useWorkspace";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const { teams } = useWorkspace();

  const ownerTeams = teams.filter((team) => team.current_user_role === "owner").length;
  const memberTeams = Math.max(teams.length - ownerTeams, 0);

  return (
    <aside className={`layout-sidebar${mobileOpen ? " layout-sidebar-mobile-open" : ""}`}>
      <div className="layout-brand">
        <div className="layout-logo">TM</div>
        <div>
          <p className="layout-brand-title">Workspace</p>
          <p className="layout-brand-subtitle">Project Console</p>
        </div>
        <Button className="layout-mobile-close" variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <nav className="layout-nav">
        <NavLink
          to="/"
          onClick={onClose}
          className={({ isActive }) => `layout-link${isActive ? " layout-link-active" : ""}`}
        >
          Home
        </NavLink>
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className={({ isActive }) => `layout-link${isActive ? " layout-link-active" : ""}`}
        >
          My Tasks
        </NavLink>
        <NavLink
          to="/teams"
          onClick={onClose}
          className={({ isActive }) => `layout-link${isActive ? " layout-link-active" : ""}`}
        >
          Teams
        </NavLink>
      </nav>

      <div className="layout-sidebar-stats">
        <div>
          <p>Total teams</p>
          <strong>{teams.length}</strong>
        </div>
        <div>
          <p>Owned teams</p>
          <strong>{ownerTeams}</strong>
        </div>
        <div>
          <p>Member teams</p>
          <strong>{memberTeams}</strong>
        </div>
      </div>

      <div className="layout-sidebar-footer">
        <ThemeToggle />
        <Badge tone="neutral">Role badges enabled</Badge>
        <Button
          variant="ghost"
          onClick={() => {
            onClose();
            logout();
          }}
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}
