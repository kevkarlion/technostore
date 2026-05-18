"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
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

/**
 * BadgeContent - Contenido animado internamente (solo opacity)
 * SIN animaciones de transform en el contenedor principal
 */
function BadgeContent({ 
  badge, 
  delay,
  variant 
}: { 
  badge: TrustBadge; 
  delay: number;
  variant: "default" | "compact";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      className={clsx(
        "relative flex flex-col items-center text-center",
        variant === "compact" ? "p-4" : "p-5"
      )}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
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
  );
}

/**
 * TrustBadges - Cards estáticas con contenido animado internamente
 * 
 * Optimizado para iOS Safari:
 * - Card completa es estática (sin animaciones de mount)
 * - Solo el contenido interno tiene animación de opacity
 * - Sin scale, sin hover transform, sin backdrop-filter animado
 * - Estructura estable para el compositor GPU
 */
export function TrustBadges({
  variant = "default",
  badges = defaultBadges,
  className,
}: TrustBadgesProps) {
  return (
    <div className={clsx("space-y-6", className)}>
      {/* Título estático */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
          ¿Por Qué Elegirnos?
        </h2>
        <p className="mt-2 text-[var(--foreground-muted)] text-sm md:text-base max-w-xl mx-auto">
          La mejor experiencia de compra en tecnología
        </p>
      </div>

      {/* Grid de cards - ESTÁTICAS, sin motion */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {badges.map((badge, index) => (
          <div
            key={badge.id}
            className={clsx(
              "group relative overflow-hidden rounded-2xl",
              "border backdrop-blur-sm transition-colors duration-300",
              "bg-gradient-to-br shadow-lg shadow-black/20",
              "from-zinc-900/80 via-zinc-800/50 to-zinc-900/80",
              "border-zinc-700/50",
              // Hover simple - solo color de borde
              "hover:border-[var(--accent)]/50"
            )}
            style={{ contain: "layout paint" }}
          >
            {/* Contenido animado internamente */}
            <BadgeContent badge={badge} delay={index * 80} variant={variant} />

            {/* Borde decorativo inferior con verde marca */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrustBadges;