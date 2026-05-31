"use client";

import { useAdminStore, adminNavItems } from "@/store/admin-store";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Package,
  ShoppingCart,
  Users,
  Shield,
  Percent,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  ShoppingCart,
  Users,
  Shield,
  Percent,
  TrendingUp,
};

export function AdminSidebar() {
  const {
    activeSection,
    setActiveSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
  } = useAdminStore();

  const { name: userName, email: userEmail, logout } = useAuth();

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64";

  const handleNavClick = (section: typeof activeSection) => {
    setActiveSection(section);
    // Close mobile sidebar after navigation
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "fixed left-0 top-0 z-50 hidden h-full flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl transition-all duration-300 lg:flex",
          sidebarWidth
        )}
      >
        {/* Logo/Brand */}
        <div className="flex h-16 items-center border-b border-slate-800 px-4">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-[var(--accent)]" />
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-semibold text-[var(--foreground)]">
                  TechnoStore
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {userName || userEmail || "Admin"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {adminNavItems.map((item) => {
            const Icon = iconMap[item.icon] || Package;
            const isActive = activeSection === item.section;

            return (
              <button
                key={item.section}
                onClick={() => handleNavClick(item.section)}
                className={clsx(
                  "group flex w-full items-center gap-3 px-4 py-3.5 lg:py-3 text-left transition-all duration-200",
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border-r-2 border-[var(--accent)]"
                    : "text-[var(--foreground-muted)] hover:bg-slate-800/50 hover:text-[var(--foreground)]"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={clsx(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-[var(--accent)]" : ""
                  )}
                />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse/Expand Toggle */}
        <div className="border-t border-slate-800 p-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-[var(--foreground-muted)] transition hover:bg-slate-800 hover:text-[var(--foreground)]"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Footer / Logout */}
        <div className="border-t border-slate-800 p-2">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 lg:py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-slate-800 hover:text-[var(--foreground)]"
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <aside
        className={clsx(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo/Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-[var(--accent)]" />
            <div className="flex flex-col">
              <span className="text-base font-semibold text-[var(--foreground)]">
                TechnoStore
              </span>
              <span className="text-xs text-[var(--foreground-muted)]">
                {userName || userEmail || "Admin"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {adminNavItems.map((item) => {
            const Icon = iconMap[item.icon] || Package;
            const isActive = activeSection === item.section;

            return (
              <button
                key={item.section}
                onClick={() => handleNavClick(item.section)}
                className={clsx(
                  "group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all duration-200",
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border-r-2 border-[var(--accent)]"
                    : "text-[var(--foreground-muted)] hover:bg-slate-800/50 hover:text-[var(--foreground)]"
                )}
              >
                <Icon
                  className={clsx(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-[var(--accent)]" : ""
                  )}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-[var(--foreground-muted)] transition hover:bg-slate-800 hover:text-[var(--foreground)]"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}