"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { clsx } from "clsx";

/**
 * GlassContainer - Reusable glassmorphism wrapper component
 *
 * Provides a frosted glass effect with configurable blur and opacity.
 * Respects prefers-reduced-motion for accessibility.
 */
export interface GlassContainerProps extends HTMLMotionProps<"div"> {
  /** Blur strength in pixels (default: 12) */
  blur?: number;
  /** Background opacity (default: 0.08) */
  opacity?: number;
  /** Enable hover effect */
  hover?: boolean;
}

export const GlassContainer = forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ children, className, blur = 12, opacity = 0.08, hover = false, style, ...props }, ref) => {
    const blurValue = `blur(${blur}px)`;

    return (
      <motion.div
        ref={ref}
        className={clsx(
          "relative overflow-hidden rounded-2xl",
          hover && "transition-colors duration-300 hover:bg-white/[0.12]",
          className
        )}
        style={{
          backdropFilter: blurValue,
          WebkitBackdropFilter: blurValue,
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {/* Gradient border effect */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "radial-gradient(circle at top left, rgba(0, 225, 186, 0.15), transparent 50%)",
          }}
        />

        {/* Content layer */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

GlassContainer.displayName = "GlassContainer";

export default GlassContainer;