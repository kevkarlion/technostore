"use client";

import { useAdminStore } from "@/store/admin-store";
import { AdminSidebar } from "./AdminSidebar";
import { SectionRenderer } from "./SectionRenderer";
import { AdminNotificationPopup } from "./AdminNotificationPopup";
import { Menu, X } from "lucide-react";

export function AdminDashboard() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useAdminStore();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile menu toggle */}
      <button
        className="fixed top-3 left-3 z-50 rounded-lg bg-[var(--surface)] p-2.5 text-[var(--foreground)] shadow-lg shadow-black/20 transition hover:bg-[var(--surface-hover)] lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar />

      {/* Notification popups — real-time order alerts */}
      <AdminNotificationPopup />

      {/* Main content area */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <SectionRenderer />
        </div>
      </main>
    </div>
  );
}