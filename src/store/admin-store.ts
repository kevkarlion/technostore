"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminSection =
  | "metrics"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "settings"
  | "banners"
  | "media"
  | "messages";

interface AdminState {
  // Navigation state
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;

  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      // Default to metrics section
      activeSection: "metrics",
      setActiveSection: (section) => set({ activeSection: section }),

      // Sidebar defaults
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Loading state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "admin-dashboard-storage",
      partialize: (state) => ({
        activeSection: state.activeSection,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Navigation items configuration
export const adminNavItems: {
  section: AdminSection;
  label: string;
  icon: string;
}[] = [
  { section: "metrics", label: "Métricas", icon: "BarChart3" },
  { section: "products", label: "Productos", icon: "Package" },
  { section: "categories", label: "Categorías", icon: "Tags" },
  { section: "orders", label: "Pedidos", icon: "ShoppingCart" },
  { section: "customers", label: "Clientes", icon: "Users" },
  { section: "settings", label: "Ajustes", icon: "Settings" },
  { section: "banners", label: "Banners", icon: "LayoutTemplate" },
  { section: "media", label: "Media", icon: "Image" },
  { section: "messages", label: "Mensajes", icon: "MessageSquare" },
];