"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { useMotionPreferences, TRANSITION, EASE } from "@/lib/motion-config";
import { GlassContainer } from "@/components/ui/premium/glass-container";

export interface PremiumHeroProps {
  /** Hero badge text */
  badge?: string;
  /** Hero title */
  title: ReactNode;
  /** Hero description */
  description?: ReactNode;
  /** Primary CTA */
  cta?: {
    href: string;
    label: string;
  };
  /** Secondary CTA */
  ctaSecondary?: {
    href: string;
    label: string;
  };
  /** Right side content (categories grid) */
  rightContent?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PremiumHero - Hero component with staggered entrance animation
 * 
 * Features:
 * - Staggered entrance animation (badge → title → description → CTAs → right content)
 * - Glassmorphism container
 * - Respects prefers-reduced-motion
 */
export function PremiumHero({
  badge = "Productos destacados",
  title,
  description,
  cta,
  ctaSecondary,
  rightContent,
  className,
}: PremiumHeroProps) {
  const { reducedMotion } = useMotionPreferences();

  // Staggered entrance variants
  const containerVariants: Variants = reducedMotion
    ? {
        hidden: {},
        visible: {},
      }
    : {
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.1,
            },
          },
        };

  const itemVariants: Variants = reducedMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : {
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: TRANSITION.medium,
              ease: EASE.standard,
            },
          },
        };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--background)] px-6 py-10 sm:px-10 sm:py-14">
      <GlassContainer blur={16} opacity={0.12} className="absolute inset-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10" />
      </GlassContainer>

      <motion.div
        className={`relative z-10 grid gap-8 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)] lg:items-center ${className || ""}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Content */}
        <div className="space-y-5">
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center rounded-full bg-accent/20 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-accent ring-1 ring-accent/40">
              {badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            variants={itemVariants}
          >
            {title}
          </motion.h1>

          {/* Description */}
          {description && (
            <motion.p
              className="max-w-xl text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base"
              variants={itemVariants}
            >
              {description}
            </motion.p>
          )}

          {/* CTAs */}
          {(cta || ctaSecondary) && (
            <motion.div className="flex flex-wrap gap-3 text-xs" variants={itemVariants}>
              {cta && (
                <Link
                  href={cta.href}
                  className="rounded-full bg-accent px-4 py-2 font-semibold text-background shadow-sm transition hover:opacity-90"
                >
                  {cta.label}
                </Link>
              )}
              {ctaSecondary && (
                <Link
                  href={ctaSecondary.href}
                  className="rounded-full bg-surface px-4 py-2 font-semibold text-foreground ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--surface-hover)]"
                >
                  {ctaSecondary.label}
                </Link>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Content */}
        {rightContent && (
          <motion.div
            className="space-y-4 rounded-3xl border border-[var(--border-subtle)] bg-accent/5 p-4 sm:p-5"
            variants={itemVariants}
          >
            {rightContent}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

export default PremiumHero;