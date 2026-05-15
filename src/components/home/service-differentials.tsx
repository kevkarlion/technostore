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
  cpu: <Cpu className="h-6 w-6" />,
  discount: <Wallet className="h-6 w-6" />,
  setup: <Wrench className="h-6 w-6" />,
  office: <CheckCircle2 className="h-6 w-6" />,
};

export function ServiceDifferentials({
  differentials = defaultDifferentials,
  className,
}: ServiceDifferentialsProps) {
  const { reducedMotion } = useMotionPreferences();

  return (
    <div className={clsx("space-y-4", className)}>
      <motion.h2
        className="text-2xl font-bold text-[var(--foreground)]"
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        whileInView={{ opacity: reducedMotion ? 1 : 1 }}
        viewport={{ once: true }}
      >
        Servicios Diferenciales
      </motion.h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {differentials.map((item, index) => (
          <motion.div
            key={item.id}
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: reducedMotion ? 0 : index * 0.1,
              duration: TRANSITION.medium,
              ease: EASE.standard,
            }}
            className={clsx(
              "flex items-start gap-4",
              "rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              {icons[item.icon]}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ServiceDifferentials;