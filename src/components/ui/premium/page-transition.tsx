"use client";

import { motion } from "framer-motion";
import { useMotionPreferences } from "@/lib/motion-config";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition - Fade-in/fade-out wrapper for page navigation
 *
 * Total transition duration: 300ms max (150ms out + 150ms in)
 * Respects prefers-reduced-motion
 */
export function PageTransition({ children }: PageTransitionProps) {
  const { reducedMotion } = useMotionPreferences();

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;