"use client";

import { motion } from "framer-motion";
import { useMotionPreferences, TRANSITION, EASE } from "@/lib/motion-config";
import { clsx } from "clsx";
import Link from "next/link";
import { Monitor, CheckCircle2, Users, PiggyBank, Zap, Shield } from "lucide-react";

/**
 * Props for PCBuilderCTA component
 */
interface PCBuilderCTAProps {
  /** Callback when CTA button is clicked */
  onCtaClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Benefit items with premium Lucide icons
 */
const benefits = [
  {
    icon: CheckCircle2,
    text: "Compatibilidad garantizada",
  },
  {
    icon: Users,
    text: "Atención personalizada",
  },
  {
    icon: PiggyBank,
    text: "Optimización por presupuesto",
  },
  {
    icon: Zap,
    text: "Respuesta rápida",
  },
] as const;

/**
 * PCBuilderCTA - Premium, sexy, bold section for PC builder
 */
export function PCBuilderCTA({ onCtaClick, className }: PCBuilderCTAProps) {
  const { reducedMotion } = useMotionPreferences();

  return (
    <div
      className={clsx(
        "relative w-full overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-[var(--accent-purple)]/20 via-[var(--background)] to-[var(--accent)]/5",
        "border border-[var(--accent)]/20",
        "px-6 py-8 md:px-10 md:py-12",
        className
      )}
    >
      {/* Background pattern - grid lines */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--foreground-muted) 1px, transparent 1px), linear-gradient(90deg, var(--foreground-muted) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Decorative glow */}
      <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-[var(--accent)]/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[var(--accent-purple)]/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon - premium con Lucide */}
        <motion.div 
          initial={reducedMotion ? {} : { scale: 0, rotate: -10 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-purple)] shadow-xl shadow-[var(--accent)]/20"
        >
          <Monitor className="h-10 w-10 text-[var(--background)]" strokeWidth={1.5} />
        </motion.div>

        {/* Title - con gradiente sexy */}
        <h2 className="text-3xl font-bold md:text-4xl">
          <span className="text-[var(--foreground)]">Armá tu </span>
          <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-purple)] bg-clip-text text-transparent">
            PC Gamer
          </span>
        </h2>

        {/* Subtitle - más bold */}
        <p className="mt-2 max-w-lg text-lg font-medium text-[var(--foreground-muted)]">
          <span className="text-[var(--accent)]">Asesoramiento personalizado</span> 100% gratis
        </p>

        {/* Benefits grid - con Lucide icons */}
        <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: TRANSITION.medium }}
              className={clsx(
                "flex flex-col items-center gap-2 rounded-xl",
                "bg-[var(--surface)]/50 p-4",
                "border border-transparent"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                <benefit.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="text-center text-sm font-medium text-[var(--foreground-muted)]">
                {benefit.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA Button - ultra sexy y bold */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: TRANSITION.medium }}
          className="mt-8"
        >
          <Link
            href="/search?pcbuilder=true"
            className={clsx(
              "group relative inline-flex items-center justify-center",
              "min-h-[56px] min-w-[200px]",
              "rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-purple)]",
              "px-10 py-4 text-lg font-bold text-[var(--background)]",
              "transition-all duration-300",
              "hover:shadow-2xl hover:shadow-[var(--accent)]/30 hover:scale-105",
              "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
              Armá tu PC
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          </Link>
        </motion.div>

        {/* Trust micro-text */}
        <p className="mt-4 text-xs text-[var(--foreground-muted)]">
          +5000 PCs armadas • 98% satisfacción • Respuesta en minutos
        </p>
      </div>
    </div>
  );
}

export default PCBuilderCTA;