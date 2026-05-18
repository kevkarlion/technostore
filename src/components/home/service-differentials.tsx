"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { clsx } from "clsx";
import { Cpu, Wallet, Wrench, CheckCircle2 } from "lucide-react";

export interface ServiceDifferential {
  id: string;
  icon: "cpu" | "discount" | "setup" | "office";
  title: string;
  description: string;
}

interface ServiceDifferentialsProps {
  differentials?: ServiceDifferential[];
  className?: string;
}

const defaultDifferentials: ServiceDifferential[] = [
  {
    id: "1",
    icon: "cpu",
    title: "Bonificación de Armado",
    description: "Con la compra de CPU incluimos armado de PC + instalación de Windows + programas básicos",
  },
  {
    id: "2",
    icon: "office",
    title: "Office Activado",
    description: "Paquete Office incluido en el servicio de armado",
  },
  {
    id: "3",
    icon: "discount",
    title: "Descuento en Efectivo",
    description: "Descuento especial en armado de PC con efectivo o transferencia",
  },
  {
    id: "4",
    icon: "setup",
    title: "Tu PC, Tus Componentes",
    description: "Trae tus componentes y te armamos la PC con descuento",
  },
];

const icons = {
  cpu: <Cpu className="h-7 w-7" />,
  discount: <Wallet className="h-7 w-7" />,
  setup: <Wrench className="h-7 w-7" />,
  office: <CheckCircle2 className="h-7 w-7" />,
};

/**
 * CardContent - Contenido animado internamente (solo opacity)
 * SIN animaciones de transform en el contenedor principal
 */
function CardContent({ 
  item, 
  delay 
}: { 
  item: ServiceDifferential; 
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      className="relative p-5 flex flex-col items-center text-center space-y-3"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {/* Icono con glow verde de marca */}
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/30">
        <div className="text-zinc-900">
          {icons[item.icon]}
        </div>
      </div>

      {/* Título premium */}
      <h3 className="font-bold text-[var(--foreground)] text-sm sm:text-base leading-tight">
        {item.title}
      </h3>

      {/* Descripción */}
      <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
        {item.description}
      </p>
    </div>
  );
}

/**
 * ServiceDifferentials - Cards estáticas con contenido animado internamente
 * 
 * Optimizado para iOS Safari:
 * - Card completa es estática (sin animaciones de mount)
 * - Solo el contenido interno tiene animación de opacity
 * - Sin scale, sin hover transform, sin backdrop-filter animado
 * - Estructura estable para el compositor GPU
 */
export function ServiceDifferentials({
  differentials = defaultDifferentials,
  className,
}: ServiceDifferentialsProps) {
  return (
    <div className={clsx("space-y-6", className)}>
      {/* Título estático */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
          ¿Por Qué Elegirnos?
        </h2>
        <p className="mt-2 text-[var(--foreground-muted)] text-sm md:text-base max-w-xl mx-auto">
          Beneficios exclusivos que hacen la diferencia en tu experiencia de compra
        </p>
      </div>

      {/* Grid de cards - ESTÁTICAS, sin motion */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {differentials.map((item, index) => (
          <div
            key={item.id}
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
            <CardContent item={item} delay={index * 80} />

            {/* Borde decorativo inferior con verde marca */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServiceDifferentials;