/**
 * CartSummary - Resumen de totales del carrito
 * 
 * Muestra subtotal, envío, impuestos y total.
 * Incluye botón para proceder al checkout.
 */

"use client";

import Link from "next/link";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { DEFAULT_CART_CONFIG } from "../types/cart";

interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
  tax?: number;
  total: number;
  itemCount: number;
  onClear?: () => void;
  showCheckoutButton?: boolean;
}

/**
 * Resumen de totales del carrito
 * 
 * @example
 * ```tsx
 * <CartSummary 
 *   subtotal={15000} 
 *   shipping={500} 
 *   tax={3150} 
 *   total={18650}
 *   itemCount={3}
 * />
 * ```
 */
export function CartSummary({
  subtotal,
  shipping = DEFAULT_CART_CONFIG.shippingCost,
  tax = Math.round(subtotal * DEFAULT_CART_CONFIG.taxRate),
  total,
  itemCount,
  onClear,
  showCheckoutButton = true,
}: CartSummaryProps) {
  const isEmpty = itemCount === 0;

  return (
    <aside className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Resumen del pedido
        </h2>
        {onClear && !isEmpty && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            Vaciar
          </button>
        )}
      </div>

      {/* Detalles */}
      <div className="space-y-2 text-sm text-[var(--foreground)]">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-[var(--foreground-muted)]">
            Subtotal ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})
          </span>
          <Price amount={subtotal} />
        </div>

        {/* Envío */}
        <div className="flex justify-between text-[var(--foreground-muted)]">
          <span>Envío</span>
          {isEmpty ? (
            <span className="text-[var(--foreground-muted)]">—</span>
          ) : (
            <Price amount={shipping} />
          )}
        </div>

        {/* Impuestos */}
        <div className="flex justify-between text-[var(--foreground-muted)]">
          <span>Impuestos (21%)</span>
          {isEmpty ? (
            <span className="text-[var(--foreground-muted)]">—</span>
          ) : (
            <Price amount={tax} />
          )}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
        <span className="font-semibold text-[var(--foreground)]">Total</span>
        {isEmpty ? (
          <span className="text-lg font-bold text-[var(--foreground)]">—</span>
        ) : (
          <Price amount={total} className="text-lg" />
        )}
      </div>

      {/* Botón checkout */}
      {showCheckoutButton && !isEmpty && (
        <Link href="/checkout" className="block">
          <Button className="w-full" size="lg">
            Proceder al checkout
          </Button>
        </Link>
      )}

      {/* Carrito vacío */}
      {isEmpty && (
        <p className="text-center text-xs text-[var(--foreground-muted)]">
          Agrega productos al carrito para continuar
        </p>
      )}
    </aside>
  );
}

/**
 * Skeleton loading del resumen
 */
export function CartSummarySkeleton() {
  return (
    <aside className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 rounded bg-[var(--background)] animate-pulse" />
        <div className="h-4 w-12 rounded bg-[var(--background)] animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-20 rounded bg-[var(--background)] animate-pulse" />
          <div className="h-4 w-16 rounded bg-[var(--background)] animate-pulse" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-12 rounded bg-[var(--background)] animate-pulse" />
          <div className="h-4 w-16 rounded bg-[var(--background)] animate-pulse" />
        </div>
      </div>

      <div className="flex justify-between border-t border-[var(--border-subtle)] pt-3">
        <div className="h-5 w-12 rounded bg-[var(--background)] animate-pulse" />
        <div className="h-6 w-20 rounded bg-[var(--background)] animate-pulse" />
      </div>

      <div className="h-12 w-full rounded bg-[var(--background)] animate-pulse" />
    </aside>
  );
}