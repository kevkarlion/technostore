import type * as React from "react";
import { clsx } from "clsx";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "success" | "danger" | "warning";
}

export function Badge({
  tone = "default",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
        tone === "default" &&
          "bg-slate-900/80 text-slate-200 ring-1 ring-slate-700/80",
        tone === "success" &&
          "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/50",
        tone === "danger" &&
          "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/50",
        tone === "warning" &&
          "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/50",
        className
      )}
      {...props}
    />
  );
}

