"use client";

import { motion } from "framer-motion";
import { useMotionPreferences, TRANSITION, EASE } from "@/lib/motion-config";
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
  shipping: <Truck className="h-7 w-7" />,
  warranty: <ShieldCheck className="h-7 w-7" />,
  installments: <CreditCard className="h-7 w-7" />,
  support: <Headphones className="h-7 w-7" />,
};

// Gradiente premium monocromático (igual que ServiceDifferentials)
const cardGradient = "from-zinc-900/80 via-zinc-800/50 to-zinc-900/80";
const borderColor = "border-zinc-700/50";

/**
 * TrustBadges - Visual trust blocks displaying shipping, warranty, payment, and support
 *
 * Diseño premium matching ServiceDifferentials:
 * - 4-column grid on desktop
 * - 2x2 grid on mobile
 * - Icon + title + subtitle layout
 * - Gradiente oscuro con borde verde marca
 * - Sin enlaces (solo visual)
 */
export function TrustBadges({
  variant = "default",
  badges = defaultBadges,
  className,
}: TrustBadgesProps) {
  const { reducedMotion } = useMotionPreferences();

  return (
    <div className={clsx("space-y-6", className)}>
      <motion.div
        className="text-center"
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: TRANSITION.medium }}
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
          ¿Por Qué Elegirnos?
        </h2>
        <p className="mt-2 text-[var(--foreground-muted)] text-sm md:text-base max-w-xl mx-auto">
          La mejor experiencia de compra en tecnología
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: reducedMotion ? 0 : index * 0.1,
              duration: TRANSITION.slow,
              ease: EASE.emphasis,
            }}
            whileHover={reducedMotion ? {} : { scale: 1.02, y: -2 }}
            style={{ willChange: "transform" }}
            className={clsx(
              "group relative overflow-hidden rounded-2xl",
              "border backdrop-blur-sm transition-all duration-300",
              "bg-gradient-to-br shadow-lg shadow-black/20",
              cardGradient,
              borderColor,
              // Fix Safari flicker: force GPU compositing layer
              "backface-hidden"
            )}
          >
            {/* Gradient overlay on hover */}
            <div className={clsx(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              "bg-gradient-to-br",
              cardGradient
            )} />

            {/* Contenido */}
            <div className={clsx(
              "relative flex flex-col items-center text-center",
              variant === "compact" ? "p-4" : "p-5"
            )}>
              {/* Icono con glow verde marca */}
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/30 mb-3">
                <div className="text-zinc-900">
                  {icons[badge.icon]}
                </div>
              </div>

              {/* Título premium */}
              <h3 className="font-bold text-[var(--foreground)] text-sm leading-tight">
                {badge.title}
              </h3>

              {/* Subtítulo */}
              <p className="mt-1 text-xs text-[var(--foreground-muted)] leading-relaxed">
                {badge.subtitle}
              </p>
            </div>

            {/* Borde decorativo inferior con verde marca */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default TrustBadges;
