"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CheckoutFailurePage() {
  useEffect(() => {
    // Clear cart on failure since payment was rejected
    // The cart clearing happens in the checkout page on error
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-3xl">
            ✕
          </div>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Pago rechazado
        </h1>
        <p className="text-xs text-slate-400">
          El pago fue rechazado. Podés intentar nuevamente o elegir otro método de pago.
        </p>
      </header>

      <div className="flex flex-col items-center gap-3">
        <Link href="/checkout">
          <Button size="lg">Volver a intentar</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm">
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}