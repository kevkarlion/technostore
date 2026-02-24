"use client";

import * as React from "react";
import { clsx } from "clsx";

export type ButtonVariant = "primary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  asChild?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-60 disabled:cursor-not-allowed";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--background)] shadow-sm hover:opacity-90",
  outline:
    "border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
  ghost:
    "bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      iconLeft,
      iconRight,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {iconLeft && <span className="mr-1.5">{iconLeft}</span>}
        {children}
        {iconRight && <span className="ml-1.5">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

