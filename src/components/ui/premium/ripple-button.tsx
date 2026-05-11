"use client";

import { motion, useMotionTemplate, useMotionValue, AnimationProps } from "framer-motion";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { TRANSITION, EASE, useMotionPreferences } from "@/lib/motion-config";

export interface RippleButtonProps extends Omit<AnimationProps<"button">, keyof React.ButtonHTMLAttributes<HTMLButtonElement>> {
  /** Button variant */
  variant?: "primary" | "secondary" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Full width */
  fullWidth?: boolean;
  /** Ripple color (default: white for primary, currentColor for others) */
  rippleColor?: string;
}

function createRipple(event: React.MouseEvent<HTMLButtonElement>, button: HTMLButtonElement, color: string) {
  const ripple = document.createElement("span");
  const rect = button.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  const rippleColor = color || "rgba(255, 255, 255, 0.4)";
  
  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - rect.left - radius}px`;
  ripple.style.top = `${event.clientY - rect.top - radius}px`;
  ripple.style.background = rippleColor;
  ripple.style.position = "absolute";
  ripple.style.borderRadius = "50%";
  ripple.style.transform = "scale(0)";
  ripple.style.animation = "ripple 0.6s ease-out forwards";
  ripple.style.pointerEvents = "none";

  const rippleContainer = button.querySelector(".ripple-container");
  if (rippleContainer) {
    rippleContainer.innerHTML = "";
    rippleContainer.appendChild(ripple);
  }

  // Clean up after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      rippleColor,
      style,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const { reducedMotion } = useMotionPreferences();
    const [isRippling, setIsRippling] = useState(false);

    const variantStyles = {
      primary: "bg-accent text-background hover:opacity-90 shadow-sm",
      secondary: "bg-surface text-foreground border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]",
      ghost: "bg-transparent text-foreground hover:bg-[var(--surface)]",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        const button = e.currentTarget;
        createRipple(e.currentTarget, button, rippleColor || (variant === "primary" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 225, 186, 0.3)"));
        setIsRippling(true);
        if (onClick) onClick(e);
        setTimeout(() => setIsRippling(false), 600);
      },
      [disabled, onClick, rippleColor, variant]
    );

    useEffect(() => {
      if (reducedMotion) return;
      
      const style = document.createElement("style");
      style.textContent = `
        @keyframes ripple {
          from {
            transform: scale(0);
            opacity: 1;
          }
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
      return () => style.remove();
    }, [reducedMotion]);

    return (
      <motion.button
        ref={ref}
        className={clsx(
          "relative overflow-hidden rounded-full font-semibold transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        style={style}
        disabled={disabled}
        onClick={handleClick}
        whileTap={reducedMotion ? {} : { scale: 0.98 }}
        transition={reducedMotion ? { duration: 0 } : { duration: TRANSITION.fast, ease: EASE.decelerate }}
        {...props}
      >
        {/* Ripple container */}
        <span className="ripple-container absolute inset-0 pointer-events-none rounded-full" />
        
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);

RippleButton.displayName = "RippleButton";

export default RippleButton;