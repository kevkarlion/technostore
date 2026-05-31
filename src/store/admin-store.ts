"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminSection =
  | "products"
  | "orders"
  | "customers"
  | "users"
  | "margins"
  | "contabilidad";

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
      // Default to products section
      activeSection: "products",
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
  { section: "products", label: "Productos", icon: "Package" },
  { section: "orders", label: "Pedidos", icon: "ShoppingCart" },
  { section: "customers", label: "Clientes", icon: "Users" },
  { section: "users", label: "Usuarios", icon: "Shield" },
  { section: "margins", label: "Márgenes", icon: "Percent" },
  { section: "contabilidad", label: "Contabilidad", icon: "TrendingUp" },
];
