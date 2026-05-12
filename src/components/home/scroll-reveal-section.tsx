"use client";

import { motion } from "framer-motion";
import { useMotionPreferences, TRANSITION, EASE } from "@/lib/motion-config";
import type { ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Animation types supported by ScrollRevealSection
 */
export type AnimationType = "fade-up" | "fade-in" | "slide-left" | "slide-right";

/**
 * Props for ScrollRevealSection component
 */
interface ScrollRevealSectionProps {
  /** Content to render inside the section */
  children: ReactNode;
  /** Type of entrance animation */
  animation: AnimationType;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Stagger delay for child elements */
  staggerChildren?: number;
  /** Only trigger animation once */
  viewportOnce?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Map of animation types to their variants
 */
const animationVariants: Record<
  AnimationType,
  { hidden: { opacity: number; y?: number; x?: number }; visible: { opacity: number; y?: number; x?: number } }
> = {
  "fade-up": {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-in": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
};

/**
 * ScrollRevealSection - Wrapper component that triggers fade-in-up animations
 * when section enters viewport using Framer Motion.
 *
 * Features:
 * - Respects prefers-reduced-motion
 * - Supports multiple animation types
 * - Configurable delay and stagger
 */
export function ScrollRevealSection({
  children,
  animation,
  delay = 0,
  staggerChildren,
  viewportOnce = true,
  className,
}: ScrollRevealSectionProps) {
  const { reducedMotion } = useMotionPreferences();
  const variants = animationVariants[animation];

  // If reduced motion is preferred, render without animation
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  // Build variants based on whether stagger is used
  const motionVariants = staggerChildren
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren,
            delayChildren: delay,
          },
        },
      }
    : {
        ...variants,
        visible: {
          ...variants.visible,
          transition: {
            duration: TRANSITION.slow,
            delay,
            ease: EASE.standard,
          },
        },
      };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: viewportOnce, margin: "-100px" }}
      variants={motionVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default ScrollRevealSection;
