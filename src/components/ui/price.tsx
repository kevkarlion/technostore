"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { getExchangeRate, formatARS } from "@/lib/exchange-rate";

interface PriceProps {
  amount: number;
  currency?: string;
  originalAmount?: number;
  className?: string;
  /** Si es true, convierte el monto (asumido USD) a ARS usando la cotización del día */
  convertToArs?: boolean;
}

export function Price({
  amount,
  currency,
  originalAmount,
  className,
  convertToArs,
}: PriceProps) {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    if (!convertToArs) return;
    getExchangeRate().then((data) => setRate(data?.venta ?? null));
  }, [convertToArs]);

  // Si convertToArs está activo, convertir USD → ARS
  const effectiveRate = convertToArs ? rate : null;
  const arsAmount =
    effectiveRate && effectiveRate > 0 ? amount * effectiveRate : amount;
  const arsOriginal =
    originalAmount && effectiveRate && effectiveRate > 0
      ? originalAmount * effectiveRate
      : originalAmount;

  const hasDiscount = arsOriginal !== undefined && arsOriginal > arsAmount;

  const currentLabel = convertToArs
    ? formatARS(arsAmount)
    : currency === "ARS"
      ? formatARS(amount)
      : currency
        ? `${currency} ${amount.toLocaleString("en-US")}`
        : `$${amount.toLocaleString("en-US")}`;

  const originalLabel =
    hasDiscount && arsOriginal !== undefined
      ? convertToArs
        ? formatARS(arsOriginal)
        : currency === "ARS"
          ? formatARS(arsOriginal)
          : currency
            ? `${currency} ${arsOriginal.toLocaleString("en-US")}`
            : `$${arsOriginal.toLocaleString("en-US")}`
      : undefined;

  return (
    <div className={clsx("flex items-baseline gap-1.5", className)}>
      <span className="font-bold text-[var(--foreground)]">
        {currentLabel}
      </span>
      {originalLabel && (
        <span className="text-sm text-[var(--foreground-muted)] line-through">
          {originalLabel}
        </span>
      )}
    </div>
  );
}
