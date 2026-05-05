/**
 * CartEmpty - Estado cuando el carrito está vacío
 * 
 * Muestra un mensaje amigable y un CTA para empezar a comprar.
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CartEmptyProps {
  message?: string;
  ctaText?: string;
}

/**
 * Componente para mostrar cuando el carrito está vacío
 * 
 * @example
 * ```tsx
 * <CartEmpty />
 * 
 * // Customizado
 * <CartEmpty 
 *   message="No hay productos en tu carrito" 
 *   ctaText="Ver productos" 
 * />
 * ```
 */
export function CartEmpty({
  message = "Tu carrito está vacío",
  ctaText = "Empezar a comprar",
}: CartEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      {/* Icono del carrito vacío */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface)]">
        <svg
          className="h-10 w-10 text-[var(--foreground-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>

      {/* Mensaje */}
      <div className="space-y-2">
        <p className="text-lg font-medium text-[var(--foreground)]">
          {message}
        </p>
        <p className="max-w-md text-sm text-[var(--foreground-muted)]">
          Navega por nuestra tienda y agrega productos al carrito para continuar.
        </p>
      </div>

      {/* CTA */}
      <Link href="/">
        <Button size="lg">
          {ctaText}
        </Button>
      </Link>
    </div>
  );
}

/**
 * Loading skeleton para el estado vacío
 */
export function CartEmptySkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="h-20 w-20 rounded-full bg-[var(--surface)] animate-pulse" />
      <div className="space-y-2 text-center">
        <div className="mx-auto h-6 w-48 rounded bg-[var(--surface)] animate-pulse" />
        <div className="mx-auto h-4 w-72 rounded bg-[var(--surface)] animate-pulse" />
      </div>
    </div>
  );
}