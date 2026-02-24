import type * as React from "react";
import { clsx } from "clsx";

interface PriceProps {
  amount: number;
  currency?: string;
  originalAmount?: number;
  className?: string;
}

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function Price({
  amount,
  currency,
  originalAmount,
  className,
}: PriceProps) {
  const currentLabel = currency
    ? `${currency} ${amount.toLocaleString("en-US")}`
    : formatter.format(amount);

  const originalLabel =
    originalAmount && originalAmount > amount
      ? currency
        ? `${currency} ${originalAmount.toLocaleString("en-US")}`
        : formatter.format(originalAmount)
      : undefined;

  return (
    <div className={clsx("flex items-baseline gap-1.5", className)}>
      <span className="text-base font-semibold text-slate-50">
        {currentLabel}
      </span>
      {originalLabel && (
        <span className="text-xs text-slate-500 line-through">
          {originalLabel}
        </span>
      )}
    </div>
  );
}

