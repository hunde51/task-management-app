import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";

type MainLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  onRefresh?: () => void;
  actions?: ReactNode;
};

export default function MainLayout({ title, subtitle, children, onRefresh, actions }: MainLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="layout-shell">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      {mobileSidebarOpen && (
        <button
          type="button"
          className="layout-sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div className="layout-main">
        <div className="layout-mobile-bar">
          <Button variant="secondary" size="sm" onClick={() => setMobileSidebarOpen(true)}>
            Menu
          </Button>
        </div>
        <Navbar title={title} subtitle={subtitle} onRefresh={onRefresh} actions={actions} />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
