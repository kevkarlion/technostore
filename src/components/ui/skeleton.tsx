import type * as React from "react";
import { clsx } from "clsx";

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-[var(--surface)]",
        className
      )}
      role="status"
      aria-label="Cargando contenido..."
      {...props}
    />
  );
}

