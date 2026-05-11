"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { clsx } from "clsx";

/**
 * AnimatedBadge - Badge with entrance animation and optional pulse for sales
 */
export interface AnimatedBadgeProps {
  /** Badge text content */
  children: React.ReactNode;
  /** Badge variant */
  variant?: "default" | "sale" | "new" | "discount";
  /** Enable pulse animation (for sale badges) */
  pulse?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge color scheme based on variant
 */
const badgeStyles = {
  default: "bg-[var(--accent)] text-[var(--background)]",
  sale: "bg-red-500/90 text-white",
  new: "bg-[var(--accent-purple)] text-white",
  discount: "bg-emerald-500/90 text-white",
};

export function AnimatedBadge({
  children,
  variant = "default",
  pulse = false,
  className,
}: AnimatedBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className={clsx(
            "inline-flex items-center justify-center",
            "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
            badgeStyles[variant],
            pulse && "animate-pulse",
            className
          )}
          role="status"
          aria-label={typeof children === "string" ? children : "badge"}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default AnimatedBadge;