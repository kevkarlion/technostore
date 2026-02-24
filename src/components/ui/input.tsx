"use client";

import * as React from "react";
import { clsx } from "clsx";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={clsx(
          "h-10 w-full rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-4 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none ring-0 transition focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

