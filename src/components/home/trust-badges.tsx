"use client";

import { motion } from "framer-motion";
import { useMotionPreferences, TRANSITION, EASE, staggerContainer } from "@/lib/motion-config";
import { clsx } from "clsx";
import { Truck, ShieldCheck, CreditCard, Headphones } from "lucide-react";

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
 * Icon components from Lucide
 */
const icons = {
  shipping: <Truck className="h-6 w-6 text-[var(--accent)]" />,
  warranty: <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />,
  installments: <CreditCard className="h-6 w-6 text-[var(--accent)]" />,
  support: <Headphones className="h-6 w-6 text-[var(--accent)]" />,
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
