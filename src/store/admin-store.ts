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

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  "products",
  "orders",
  "customers",
  "users",
  "margins",
  "contabilidad",
];

export interface AdminNavState {
  page: number;
  search: string;
  status: string;
}

export const DEFAULT_ADMIN_NAV_STATE: AdminNavState = {
  page: 1,
  search: "",
  status: "all",
};

export function createDefaultNavState(): Record<AdminSection, AdminNavState> {
  return {
    products: { ...DEFAULT_ADMIN_NAV_STATE },
    orders: { ...DEFAULT_ADMIN_NAV_STATE },
    customers: { ...DEFAULT_ADMIN_NAV_STATE },
    users: { ...DEFAULT_ADMIN_NAV_STATE },
    margins: { ...DEFAULT_ADMIN_NAV_STATE },
    contabilidad: { ...DEFAULT_ADMIN_NAV_STATE },
  };
}

interface AdminState {
  // Navigation state
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
  // Cambio de sección atómico: activa la sección destino Y resetea su
  // navState en una sola escritura para que el listener de URL del hook
  // dispare una vez con la URL limpia (sin historial duplicado).
  navigateToSection: (section: AdminSection) => void;

  // Nav state por sección (URL es la fuente de verdad)
  navState: Record<AdminSection, AdminNavState>;
  setNavState: (section: AdminSection, partial: Partial<AdminNavState>) => void;
  resetNavState: (section: AdminSection) => void;
  resetAllNavState: () => void;

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
      navigateToSection: (section) =>
        set((state) => {
          if (state.activeSection === section) return state;
          return {
            activeSection: section,
            navState: {
              ...state.navState,
              [section]: { ...DEFAULT_ADMIN_NAV_STATE },
            },
          };
        }),

      // Nav state por sección
      navState: createDefaultNavState(),
      setNavState: (section, partial) =>
        set((state) => ({
          navState: {
            ...state.navState,
            [section]: { ...state.navState[section], ...partial },
          },
        })),
      resetNavState: (section) =>
        set((state) => ({
          navState: {
            ...state.navState,
            [section]: { ...DEFAULT_ADMIN_NAV_STATE },
          },
        })),
      resetAllNavState: () => set({ navState: createDefaultNavState() }),

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
      // La URL es la fuente de verdad para sección activa y navState;
      // solo se persiste el colapso del sidebar.
      partialize: (state) => ({
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
