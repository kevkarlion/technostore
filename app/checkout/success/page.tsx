"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";

function generateOrderId(): string {
  const timestamp = Date.now();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${randomChars}`;
}

function generateFallbackOrder(): OrderResult {
  const timestamp = Date.now();
  return {
    orderId: generateOrderId(),
    items: [],
    subtotal: 0,
    shipping: 0,
    taxes: 0,
    total: 0,
    customer: {
      name: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
    },
    createdAt: new Date(timestamp).toISOString(),
  };
}

interface OrderResult {
  orderId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  taxes: number;
  total: number;
  customer: {
    name: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  createdAt: string;
  paymentId?: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const { setOrderResult, reset } = useCheckoutStore();
  const { clear: clearCart } = useCartStore();

  const paymentId = searchParams.get("payment_id");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const preferenceId = searchParams.get("preference_id");

  useEffect(() => {
    // Build order result from MP return data
    const order: OrderResult = {
      orderId: generateOrderId(),
      items: [],
      subtotal: 0,
      shipping: 0,
      taxes: 0,
      total: 0,
      customer: {
        name: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
      },
      createdAt: new Date().toISOString(),
      paymentId: paymentId ?? undefined,
    };

    setOrderResult(order);
    clearCart();
    reset();
  }, [paymentId, merchantOrderId, preferenceId, setOrderResult, clearCart, reset]);

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

      {paymentId && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
          <p className="text-xs text-slate-400">ID de pago</p>
          <p className="font-mono text-sm text-emerald-400">{paymentId}</p>
        </div>
      )}

      <div className="flex justify-center">
        <Link href="/">
          <Button size="lg">Seguir comprando</Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}