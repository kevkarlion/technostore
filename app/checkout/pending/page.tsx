"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CheckoutPendingPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-3xl">
            ⏳
          </div>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Pago pendiente
        </h1>
        <p className="text-xs text-slate-400">
          Tu pago está siendo procesado. Te notifyaremos cuando se confirme.
        </p>
        {paymentId && (
          <p className="text-xs text-slate-500">
            Referencia: {paymentId}
          </p>
        )}
      </header>

      <div className="flex flex-col items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm">
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}