"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";
import { clsx } from "clsx";

/**
 * SkeletonCard - Skeleton loader with shimmer animation and ARIA attributes
 *
 * Provides a loading state placeholder with shimmer effect.
 * Respects prefers-reduced-motion for accessibility.
 */
export interface SkeletonCardProps {
  /** Additional CSS classes */
  className?: string;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Custom width (default: 100%) */
  width?: string | number;
  /** Custom height (default: 1rem) */
  height?: string | number;
  /** Rounded corners variant */
  variant?: "default" | "circle" | "sm" | "lg" | "full";
}

const roundedVariants = {
  default: "rounded-lg",
  circle: "rounded-full",
  sm: "rounded",
  lg: "rounded-xl",
  full: "rounded-2xl",
};

export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      delay = 0,
      width = "100%",
      height = "1rem",
      variant = "default",
    },
    ref
  ) => {
    const isReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return (
      <motion.div
        ref={ref}
        className={clsx(
          "relative overflow-hidden bg-white/[0.06]",
          roundedVariants[variant],
          className
        )}
        style={{ width, height }}
        aria-hidden="true"
      >
        {/* Shimmer effect overlay */}
        {!isReducedMotion && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: `shimmer 1.5s ease-in-out ${delay}ms infinite`,
            }}
          />
        )}

        {/* Accessibility: announce loading state */}
        <span className="sr-only">Loading content...</span>
      </motion.div>
    );
  }
);

SkeletonCard.displayName = "SkeletonCard";

/**
 * Pre-built skeleton layouts for common use cases
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonCard
          key={i}
          width={i === lines - 1 ? "75%" : "100%"}
          height="0.875rem"
          delay={i * 100}
        />
      ))}
    </div>
  );
}

export default SkeletonCard;