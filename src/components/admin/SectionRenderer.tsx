"use client";

import { lazy, Suspense, type ComponentType } from "react";
import { useAdminStore, type AdminSection } from "@/store/admin-store";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load all sections for code-splitting
const sections: Record<AdminSection, () => Promise<{ default: ComponentType }>> = {
  products: () => import("./sections/AdminProducts"),
  orders: () => import("./sections/AdminOrders"),
  customers: () => import("./sections/AdminCustomers"),
  users: () => import("./sections/AdminUsers"),
  margins: () => import("./sections/AdminMargins"),
  contabilidad: () => import("./sections/AdminContabilidad"),
};

// Loading skeleton for sections
function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-1/3 rounded-lg bg-slate-800" />
      <div className="grid gap-4">
        <div className="h-32 rounded-xl bg-slate-800" />
        <div className="h-64 rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}

export function SectionRenderer() {
  const activeSection = useAdminStore((state) => state.activeSection);

  // Lazy load the active section
  const SectionComponent = lazy(sections[activeSection]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="h-full"
      >
        <Suspense fallback={<SectionSkeleton />}>
          <SectionComponent />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}