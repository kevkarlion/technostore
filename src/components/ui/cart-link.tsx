"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";

export interface CartLinkProps {
  className?: string;
  variant?: "full" | "icon";
}

export function CartLink({ className, variant = "full" }: CartLinkProps) {
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (variant === "icon") {
    return (
      <Link
        href="/cart"
        aria-label="Open cart"
        className={className}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--background)] text-[10px] font-bold text-[var(--accent)]">
            {cartCount}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      aria-label="Open cart"
      className={className}
    >
      <span className="flex items-center gap-1.5">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        Carrito
        {cartCount > 0 && (
          <span className="ml-1 rounded-full bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
            {cartCount}
          </span>
        )}
      </span>
    </Link>
  );
}