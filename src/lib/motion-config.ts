"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Standardized animation durations based on design tokens
 */
export const TRANSITION = {
  fast: 0.15,   // 150ms - quick micro-interactions
  medium: 0.3,  // 300ms - standard transitions
  slow: 0.5,    // 500ms - complex animations
} as const;

/**
 * Standardized easing curves
 */
export const EASE = {
  standard: [0.4, 0, 0.2, 1] as const,      // Material Design standard
  decelerate: [0, 0, 0.2, 1] as const,       // Material Design decelerate
  accelerate: [0.4, 0, 1, 1] as const,       // Material Design accelerate
  smooth: [0.4, 0, 0.2, 1] as const,         // Smooth entry
  bounce: [0.34, 1.56, 0.64, 1] as const,    // Subtle bounce for emphasis
} as const;

/**
 * Motion configuration for standard users
 */
export const motionConfig = {
  default: {
    ease: EASE.standard,
    duration: TRANSITION.medium,
  },
  reducedMotion: false,
} as const;

/**
 * Hook to get reduced motion preference
 * Automatically respects prefers-reduced-motion
 */
export function useMotionPreferences() {
  const reduceMotion = useReducedMotion();

  return {
    reducedMotion: reduceMotion ?? false,
    duration: reduceMotion ? 0 : TRANSITION.medium,
    ease: reduceMotion ? [0, 0, 1, 1] : EASE.standard,
  };
}

/**
 * Check reduced motion preference (works outside React)
 */
export function getReducedMotionPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animation variants for common entrance animations
 */
export const entranceVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
};

/**
 * Stagger configuration for sequenced animations
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Hover animation variants
 */
export const hoverVariants = {
  scale: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
  },
  lift: {
    rest: { y: 0 },
    hover: { y: -4, transition: { duration: TRANSITION.fast } },
  },
  glow: {
    rest: { boxShadow: "0 0 0 rgba(0, 225, 186, 0)" },
    hover: { boxShadow: "0 0 16px rgba(0, 225, 186, 0.2)" },
  },
};

/**
 * Skeleton shimmer animation keyframes are defined in CSS
 */
export const shimmerKeyframes = {
  "0%": { backgroundPosition: "-200% 0" },
  "100%": { backgroundPosition: "200% 0" },
};