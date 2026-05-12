"use client";

import { motion } from "framer-motion";
import { useMotionPreferences, TRANSITION, EASE, entranceVariants } from "@/lib/motion-config";
import { clsx } from "clsx";

/**
 * Props for PromotionalBanner component
 */
interface PromotionalBannerProps {
  /** Badge text to display (e.g., "HOT SALE", "-20%") */
  badge?: string;
  /** Main title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** CTA button configuration */
  cta?: {
    label: string;
    href: string;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pulse animation keyframes for the badge
 */
const pulseKeyframes = `
  @keyframes subtlePulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
  }
`;

/**
 * PromotionalBanner - Animated banner for promotions, HOT SALE, or seasonal offers
 *
 * Features:
 * - Animated badge with pulse effect
 * - Gradient background using accent colors
 * - Hover scale effect
 * - Responsive full-width design
 */
export function PromotionalBanner({
  badge = "HOT SALE",
  title,
  description,
  cta,
  className,
}: PromotionalBannerProps) {
  const { reducedMotion } = useMotionPreferences();

  return (
    <>
      <style>{pulseKeyframes}</style>
      {reducedMotion ? (
        <div
          className={clsx(
            "relative w-full overflow-hidden rounded-xl",
            "bg-gradient-to-r from-[var(--accent-purple)] via-[var(--accent-purple)]/80 to-transparent",
            "px-4 py-5 md:px-8 md:py-6",
            className
          )}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-bold text-[var(--background)]">
                {badge}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {description && (
                  <p className="mt-1 text-sm text-white/80">{description}</p>
                )}
              </div>
            </div>
            {cta && (
              <a
                href={cta.href}
                className={clsx(
                  "inline-flex items-center justify-center",
                  "min-h-[44px] min-w-[120px]",
                  "rounded-lg bg-[var(--accent)] px-5 py-2.5",
                  "text-sm font-semibold text-[var(--background)]",
                  "hover:opacity-90",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--accent-purple)]",
                  "cursor-pointer"
                )}
              >
                {cta.label}
              </a>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: entranceVariants.fadeInUp.hidden,
            visible: {
              ...entranceVariants.fadeInUp.visible,
              transition: {
                duration: TRANSITION.slow,
                ease: EASE.smooth,
              },
            },
          }}
          whileHover={{ scale: 1.01 }}
          className={clsx(
            "relative w-full overflow-hidden rounded-xl",
            "bg-gradient-to-r from-[var(--accent-purple)] via-[var(--accent-purple)]/80 to-transparent",
            "px-4 py-5 md:px-8 md:py-6",
            className
          )}
        >
          {/* Decorative elements */}
          <div
            className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--accent)]/10"
            style={{ animation: "subtlePulse 3s ease-in-out infinite" }}
          />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[var(--accent)]/5" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-bold text-[var(--background)]"
                style={{ animation: "subtlePulse 2s ease-in-out infinite" }}
              >
                {badge}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {description && (
                  <p className="mt-1 text-sm text-white/80">{description}</p>
                )}
              </div>
            </div>
            {cta && (
              <a
                href={cta.href}
                className={clsx(
                  "inline-flex items-center justify-center",
                  "min-h-[44px] min-w-[120px]",
                  "rounded-lg bg-[var(--accent)] px-5 py-2.5",
                  "text-sm font-semibold text-[var(--background)]",
                  "transition-transform duration-200",
                  "hover:scale-[1.02] hover:opacity-90",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--accent-purple)]",
                  "cursor-pointer"
                )}
              >
                {cta.label}
              </a>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}

export default PromotionalBanner;
