"use client";

import { motion } from "framer-motion";
import { useMotionPreferences, TRANSITION, EASE, staggerContainer } from "@/lib/motion-config";
import { clsx } from "clsx";

/**
 * Trust badge data interface
 */
export interface TrustBadge {
  id: string;
  icon: "shipping" | "warranty" | "installments" | "support";
  title: string;
  subtitle: string;
}

/**
 * Props for TrustBadges component
 */
interface TrustBadgesProps {
  /** Variant: default or compact */
  variant?: "default" | "compact";
  /** Custom badges to display */
  badges?: TrustBadge[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default trust badges for TechnoStore
 */
const defaultBadges: TrustBadge[] = [
  {
    id: "1",
    icon: "shipping",
    title: "Envíos a todo el país",
    subtitle: "Entregamos en 24-72 horas",
  },
  {
    id: "2",
    icon: "warranty",
    title: "Garantía oficial",
    subtitle: "Todos los productos incluyen",
  },
  {
    id: "3",
    icon: "installments",
    title: "Cuotas sin interés",
    subtitle: "Hasta 12 cuotas con todas las tarjetas",
  },
  {
    id: "4",
    icon: "support",
    title: "Atención personalizada",
    subtitle: "Te asesoramos antes de comprar",
  },
];

/**
 * Icon components as inline SVG for each badge type
 */
const icons = {
  shipping: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-[var(--accent)]"
    >
      <path d="M15 8h.01" />
      <rect width="16" height="13" x="4" y="3" rx="3" />
      <path d="M4 14h12" />
      <path d="M7 18h.01" />
      <path d="M17 18h1" />
      <path d="m4 3-2 3h12l-2-3" />
    </svg>
  ),
  warranty: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-[var(--accent)]"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  installments: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-[var(--accent)]"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  support: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-[var(--accent)]"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

/**
 * TrustBadges - Visual trust blocks displaying shipping, warranty, payment, and support
 *
 * Features:
 * - 4-column grid on desktop
 * - 2x2 grid on mobile
 * - Icon + title + subtitle layout
 * - Subtle background and rounded borders
 */
export function TrustBadges({
  variant = "default",
  badges = defaultBadges,
  className,
}: TrustBadgesProps) {
  const { reducedMotion } = useMotionPreferences();

  const isCompact = variant === "compact";

  return (
    <div className={clsx("space-y-4", className)}>
      <motion.h2
        className="text-2xl font-bold text-[var(--foreground)]"
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        whileInView={{ opacity: reducedMotion ? 1 : 1 }}
        viewport={{ once: true }}
      >
        ¿Por qué elegirnos?
      </motion.h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {badges.map((badge, index) => (
          <motion.a
            key={badge.id}
            href="#"
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: reducedMotion ? 0 : index * 0.1,
              duration: TRANSITION.medium,
              ease: EASE.standard,
            }}
            className={clsx(
              "flex flex-col items-center text-center",
              "rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4",
              "transition-all duration-200",
              "hover:border-[var(--accent)]/50 hover:shadow-md hover:shadow-[var(--accent)]/10",
              isCompact ? "p-3" : "p-5"
            )}
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10">
              {icons[badge.icon]}
            </div>
            <h3 className={clsx("font-semibold text-[var(--foreground)]", isCompact ? "text-sm" : "text-base")}>
              {badge.title}
            </h3>
            <p className={clsx("mt-1 text-[var(--muted)]", isCompact ? "text-xs" : "text-sm")}>
              {badge.subtitle}
            </p>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

export default TrustBadges;
