"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { useCartStore } from "@/store/cart-store";
import type { Category } from "@/domain/models/category";

interface SiteHeaderProps {
  categories?: Category[];
}

export function SiteHeader({ categories = [] }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  
  // Get cart count
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Default nav items
  const mainNav = [
    { href: "/", label: "Home" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="TechnoStore home"
        >
          <span className="relative h-9 w-auto sm:h-10">
            <Image
              src="/logo2.png"
              alt="TechnoStore"
              width={120}
              height={40}
              className="block h-9 w-auto object-contain object-left sm:hidden"
              priority
            />
            <Image
              src="/logo-texto.png"
              alt="TechnoStore"
              width={160}
              height={40}
              className="hidden h-10 w-auto object-contain object-left sm:block"
              priority
            />
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden flex-1 items-center justify-between gap-8 md:flex">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)]">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-full px-3 py-1.5 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                  pathname === item.href &&
                    "bg-[var(--surface)] text-[var(--foreground)]"
                )}
              >
                {item.label}
              </Link>
            ))}
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            >
              Search products
            </Link>
            <Link
              href="/cart"
              aria-label="Open cart"
              className="relative rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--background)] shadow-sm transition hover:opacity-90"
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Carrito
                {cartCount > 0 && (
                  <span className="ml-1 rounded-full bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                    {cartCount}
                  </span>
                )}
              </span>
            </Link>
          </div>
        </nav>

        {/* Mobile menu button */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link
            href="/search"
            aria-label="Search products"
            className="rounded-full bg-[var(--surface)] p-2 text-xs font-medium ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--surface-hover)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <Link
            href="/cart"
            aria-label="Open cart"
            className="relative rounded-full bg-[var(--accent)] p-2 text-xs font-semibold text-[var(--background)] shadow-sm transition hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--background)] text-[10px] font-bold text-[var(--accent)]">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full bg-[var(--surface)] p-2 text-xs font-medium ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--surface-hover)]"
            aria-label="Toggle menu"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
