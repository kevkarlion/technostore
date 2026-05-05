/**
 * CartBadge - Indicador de cantidad en el navbar
 * 
 * Muestra la cantidad total de productos en el carrito.
 * Optimizado para evitar re-renders innecesarios.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "../store/cart-store";
import { clsx } from "clsx";

interface CartBadgeProps {
  variant?: "full" | "icon";
  className?: string;
}

/**
 * Icono del carrito (SVG)
 */
function CartIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
      />
    </svg>
  );
}

/**
 * Badge principal del carrito
 * 
 * @example
 * ```tsx
 * // Variante texto completo
 * <CartBadge variant="full" />
 * 
 * // Variante solo ícono
 * <CartBadge variant="icon" />
 * ```
 */
export function CartBadge({ variant = "full", className }: CartBadgeProps) {
  // Forzar actualización cuando cambia el store - subscribe internamente
  const items = useCartStore((state) => state.items);
  const actualCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Mostrar skeleton en server-side (items undefined o vacío inicial)
  if (items === undefined) {
    // Server-side or loading state - mostrar sin badge
    return (
      <Link 
        href="/cart" 
        aria-label="Carrito de compras" 
        className={className}
      >
        {variant === "icon" ? (
          <CartIcon className="h-5 w-5" />
        ) : (
          <span className="flex items-center gap-1.5">
            <CartIcon className="h-4 w-4" />
            Carrito
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link 
      href="/cart" 
      aria-label={`Carrito con ${actualCount} productos`} 
      className={className}
    >
      {variant === "icon" ? (
        <div className="relative">
          <CartIcon className="h-5 w-5" />
          {actualCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--background)] text-[10px] font-bold text-[var(--accent)]">
              {actualCount > 99 ? "99+" : actualCount}
            </span>
          )}
        </div>
      ) : (
        <span className="flex items-center gap-1.5">
          <CartIcon className="h-4 w-4" />
          Carrito
          {actualCount > 0 && (
            <span className="ml-1 rounded-full bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
              {actualCount > 99 ? "99+" : actualCount}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

/**
 * Versión simple del badge para usar en móviles
 */
export function CartBadgeSimple({ className }: { className?: string }) {
  const actualCount = useCartStore(
    (state) => state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  return (
    <Link href="/cart" className={clsx("relative", className)}>
      <CartIcon className="h-5 w-5" />
      {actualCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {actualCount > 99 ? "99+" : actualCount}
        </span>
      )}
    </Link>
  );
}