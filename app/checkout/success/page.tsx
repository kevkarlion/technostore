"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/store/cart-store";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const { orderResult, reset } = useCheckoutStore();
  const { clear: clearCart } = useCartStore();

  // Clear cart and reset checkout state on mount
  useEffect(() => {
    clearCart();
    reset();
  }, [clearCart, reset]);

  if (!orderResult) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="text-lg font-semibold text-slate-50">
          No tenés ningún pedido.
        </div>
        <Link href="/">
          <Button>Volver a la tienda</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
            ✓
          </div>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          ¡Pedido confirmado!
        </h1>
        <p className="text-xs text-slate-400">
          Tu pedido ha sido procesado correctamente.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
        <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-4">
          <div>
            <p className="text-xs text-slate-400">Número de pedido</p>
            <p className="text-lg font-semibold text-slate-50">
              {orderResult.orderId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Fecha</p>
            <p className="text-sm text-slate-50">
              {new Date(orderResult.createdAt).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-4 space-y-2 border-b border-slate-700 pb-4 text-xs">
          <p className="font-medium text-slate-50">Datos del cliente</p>
          <p className="text-slate-300">
            {orderResult.customer.name} {orderResult.customer.lastName}
          </p>
          <p className="text-slate-300">{orderResult.customer.email}</p>
          <p className="text-slate-300">{orderResult.customer.phone}</p>
          <p className="text-slate-300">
            {orderResult.customer.address}, {orderResult.customer.city},{" "}
            {orderResult.customer.postalCode}
          </p>
        </div>

        {/* Order Items */}
        <div className="mb-4 space-y-2 border-b border-slate-700 pb-4">
          <p className="text-xs font-medium text-slate-50">Productos</p>
          <div className="space-y-1 text-xs">
            {orderResult.items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between text-slate-300"
              >
                <span>
                  {item.productName} x{item.quantity}
                </span>
                <Price amount={item.price * item.quantity} />
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1 text-xs text-slate-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <Price amount={orderResult.subtotal} />
          </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <Price amount={orderResult.shipping} />
          </div>
          <div className="flex justify-between">
            <span>Impuestos</span>
            <Price amount={orderResult.taxes} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-4">
          <span className="text-sm font-semibold text-slate-50">Total</span>
          <Price amount={orderResult.total} className="text-base" />
        </div>
      </div>

      <div className="flex justify-center">
        <Link href="/">
          <Button size="lg">Seguir comprando</Button>
        </Link>
      </div>
    </div>
  );
}