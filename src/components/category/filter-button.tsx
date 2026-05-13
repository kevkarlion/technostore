"use client";

import { SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

interface FilterButtonProps {
  onClick: () => void;
  activeCount: number;
}

export function FilterButton({ onClick, activeCount }: FilterButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 shadow-lg shadow-[var(--accent)]/30 transition-all hover:scale-105 lg:hidden"
    >
      <SlidersHorizontal className="h-5 w-5 text-[var(--background)]" />
      <span className="font-semibold text-[var(--background)]">Filtrar</span>
      {activeCount > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--accent)]">
          {activeCount}
        </span>
      )}
    </motion.button>
  );
}