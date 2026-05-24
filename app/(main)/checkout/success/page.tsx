"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/features/cart/store/cart-store";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import {
  Package,
  ChevronRight,
  Mail,
  HelpCircle,
  ShoppingBag,
  Clock,
  ShieldCheck,
  FileText,
} from "lucide-react";
import Image from "next/image";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SavedOrder {
  orderId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }>;
  totals: {
    subtotal: number;
    shipping: number;
    taxes: number;
    total: number;
  };
  customer: {
    name: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

interface DisplayOrder {
  orderId: string;
  items: SavedOrder["items"];
  totals: SavedOrder["totals"];
  customer: SavedOrder["customer"];
  createdAt: string;
  paymentId?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function loadOrderFromStorage(): DisplayOrder | null {
  try {
    const raw = sessionStorage.getItem("checkout_order");
    const paymentId = sessionStorage.getItem("checkout_payment_id");
    if (!raw) return null;

    const parsed: SavedOrder = JSON.parse(raw);
    return {
      orderId: parsed.orderId,
      items: parsed.items,
      totals: parsed.totals,
      customer: parsed.customer,
      createdAt: parsed.createdAt || new Date().toISOString(),
      paymentId: paymentId || undefined,
    };
  } catch {
    return null;
  }
}

// ─── Success Content ────────────────────────────────────────────────────────

function SuccessContent() {
  const searchParams = useSearchParams();
  const { setOrderResult, reset } = useCheckoutStore();
  const { clear: clearCart } = useCartStore();
  const [order, setOrder] = useState<DisplayOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    // Try loading from sessionStorage first
    const saved = loadOrderFromStorage();
    if (saved) {
      setOrder(saved);
      setLoading(false);

      // Clean up storage
      try {
        sessionStorage.removeItem("checkout_order");
        sessionStorage.removeItem("checkout_payment_id");
      } catch {
        // ignore
      }
      return;
    }

    // Fallback: minimal order from URL
    const fallback: DisplayOrder = {
      orderId: `ORD-${Date.now()}`,
      items: [],
      totals: { subtotal: 0, shipping: 0, taxes: 0, total: 0 },
      customer: { name: "", lastName: "", email: "" },
      createdAt: new Date().toISOString(),
      paymentId: paymentId ?? undefined,
    };
    setOrder(fallback);
    setLoading(false);
  }, [paymentId]);

  useEffect(() => {
    if (!order) return;

    // Set order result in store (cleanup)
    setOrderResult({
      orderId: order.orderId,
      items: order.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        price: i.unitPrice,
      })),
      subtotal: order.totals.subtotal,
      shipping: order.totals.shipping,
      taxes: order.totals.taxes,
      total: order.totals.total,
      customer: {
        name: order.customer.name,
        lastName: order.customer.lastName,
        email: order.customer.email,
        phone: "",
        address: "",
        city: "",
        postalCode: "",
      },
      createdAt: order.createdAt,
      paymentId: order.paymentId,
    });
    clearCart();
    reset();
  }, [order, setOrderResult, clearCart, reset]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const hasItems = order && order.items.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      {/* ── Success header ─────────────────────────────────────────────── */}
      <header className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 ring-1 ring-emerald-500/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/30">
            <svg
              className="h-6 w-6 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          ¡Recibimos tu pedido!
        </h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          Hemos recibido tu compra correctamente. Nuestro equipo está verificando
          el stock y validando el pago. Te enviaremos un correo con la
          confirmación final y los detalles del pedido.
        </p>
      </header>

      {/* ── Order ID ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          N° de pedido
        </p>
        <p className="mt-1 font-mono text-lg font-semibold text-emerald-400">
          #{order?.orderId.substring(0, 14)}
        </p>
        {order?.createdAt && (
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(order.createdAt)}
          </p>
        )}
      </div>

      {/* ── Status timeline ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Clock className="h-4 w-4 text-emerald-400" />
          Estado del pedido
        </h2>

        <div className="mt-4 space-y-0">
          {/* Step 1: Received */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30">
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div className="h-8 w-px bg-emerald-500/20" />
            </div>
            <div className="pb-8">
              <p className="text-sm font-medium text-emerald-300">Pedido recibido</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tu compra fue registrada exitosamente.
              </p>
            </div>
          </div>

          {/* Step 2: Verifying */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="h-8 w-px bg-slate-800" />
            </div>
            <div className="pb-8">
              <p className="text-sm font-medium text-amber-300">En validación</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Verificando stock y confirmando el pago.
              </p>
            </div>
          </div>

          {/* Step 3: Confirmed (pending) */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Confirmación final</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Recibirás un correo con los detalles cuando esté listo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Order summary ──────────────────────────────────────────────── */}
      {hasItems && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Package className="h-4 w-4 text-emerald-400" />
            Resumen del pedido
          </h2>

          {/* Items */}
          <div className="mt-4 divide-y divide-slate-800/50">
            {order!.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {/* Thumbnail */}
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-600">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Cant: {item.quantity} × <Price amount={item.unitPrice} />
                  </p>
                </div>
                <Price
                  amount={item.unitPrice * item.quantity}
                  className="text-sm font-semibold text-slate-200"
                />
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <Price amount={order!.totals.subtotal} className="text-slate-300" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Envío</span>
              <Price amount={order!.totals.shipping} className="text-slate-300" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Impuestos</span>
              <Price amount={order!.totals.taxes} className="text-slate-300" />
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-semibold">
              <span className="text-slate-200">Total</span>
              <Price amount={order!.totals.total} className="text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {/* ── Next steps ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-300">
          <ShieldCheck className="h-4 w-4" />
          Próximos pasos
        </h2>
        <ul className="mt-3 space-y-3">
          <li className="flex gap-3 text-sm">
            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400/60" />
            <span className="text-slate-400">
              <strong className="text-slate-300">Validación de stock:</strong>{" "}
              Verificaremos la disponibilidad de los productos que compraste.
            </span>
          </li>
          <li className="flex gap-3 text-sm">
            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400/60" />
            <span className="text-slate-400">
              <strong className="text-slate-300">Confirmación por correo:</strong>{" "}
              Te enviaremos un email a <strong className="text-slate-300">{order?.customer.email || "tu correo"}</strong> con los detalles finales.
            </span>
          </li>
          <li className="flex gap-3 text-sm">
            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400/60" />
            <span className="text-slate-400">
              <strong className="text-slate-300">Despacho:</strong>{" "}
              Una vez confirmado, procesaremos el envío a la dirección registrada.
            </span>
          </li>
        </ul>
      </div>

      {/* ── Support ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
            <HelpCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">¿Tenés dudas?</h2>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Si necesitas ayuda con tu pedido, podés contactarnos a través de
              nuestra página de contacto o respondiendo al correo de confirmación
              que recibirás.
            </p>
          </div>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Link href="/" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto gap-2">
            <ShoppingBag className="h-4 w-4" />
            Seguir comprando
          </Button>
        </Link>
        <Link
          href="/"
          className="text-xs text-slate-500 transition hover:text-slate-300"
        >
          Volver al inicio
        </Link>
      </div>

      {/* ── Footer note ────────────────────────────────────────────────── */}
      <p className="text-center text-xs text-slate-600">
        Gracias por confiar en TechnoStore. 🚀
      </p>
    </div>
  );
}

// ─── Page wrapper ───────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
