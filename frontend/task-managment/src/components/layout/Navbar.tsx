import type { ReactNode } from "react";

import Button from "../ui/Button";

type NavbarProps = {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  actions?: ReactNode;
};

export default function Navbar({ title, subtitle, onRefresh, actions }: NavbarProps) {
  return (
    <header className="layout-navbar">
      <div>
        <p className="layout-eyebrow">Task & Team Management</p>
        <h1>{title}</h1>
        <p className="layout-subtitle">{subtitle}</p>
      </div>
      <div className="layout-navbar-actions">
        {onRefresh && (
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        )}
        {actions}
      </div>
    </header>
  );
}
