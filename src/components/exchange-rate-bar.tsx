"use client";

import { useState, useEffect } from "react";
import { getExchangeRate, formatARS, type ExchangeRate } from "@/lib/exchange-rate";

export function ExchangeRateBar() {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await getExchangeRate();
      if (!mounted) return;
      setRate(data);
      setLoading(false);
    }

    load();

    // Refrescar cada 30 minutos
    const interval = setInterval(load, 30 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) return null;

  const venta = rate?.venta ?? 0;

  return (
    <div className="border-t border-[var(--border-subtle)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
        <span className="text-xs text-[var(--foreground-muted)]">
          Precio del dólar (Banco Nación)
        </span>
        <span className="text-xs font-semibold text-[var(--foreground)]">
          ${venta.toLocaleString("es-AR")}
        </span>
        <span className="text-[10px] text-[var(--foreground-muted)]">
          ARS
        </span>
      </div>
    </div>
  );
}
