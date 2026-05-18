"use client";

import { motion } from "framer-motion";
import { useMotionPreferences, TRANSITION, EASE } from "@/lib/motion-config";
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

// Gradiente premium monocromático (todas las cards iguales)
const cardGradient = "from-zinc-900/80 via-zinc-800/50 to-zinc-900/80";
const borderColor = "border-zinc-700/50";

export function ServiceDifferentials({
  differentials = defaultDifferentials,
  className,
}: ServiceDifferentialsProps) {
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
          Beneficios exclusivos que hacen la diferencia en tu experiencia de compra
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {differentials.map((item, index) => (
          <motion.div
            key={item.id}
            initial={reducedMotion ? {} : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: reducedMotion ? 0 : index * 0.1,
              duration: TRANSITION.slow,
              ease: EASE.emphasis,
            }}
            className={clsx(
              "group relative overflow-hidden rounded-2xl",
              "border backdrop-blur-sm transition-all duration-300",
              "bg-gradient-to-br shadow-lg shadow-black/20",
              cardGradient,
              borderColor,
              // Fix iOS flicker: force GPU layer and remove transform animations
              "translate-z-0"
            )}
            style={{ transform: "translateZ(0)" }}
          >
            {/* Gradient overlay on hover - solo opacity, sin animaciones complejas */}
            <div className={clsx(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              "bg-gradient-to-br",
              cardGradient
            )} />

            {/* Contenido */}
            <div className="relative p-5 flex flex-col items-center text-center space-y-3">
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

            {/* Borde decorativo inferior con verde marca */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ServiceDifferentials;