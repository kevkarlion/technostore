"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { SearchBar } from "@/components/ui/search-bar";
import { CategoryDropdown } from "@/components/ui/category-dropdown";
import { CartLink } from "@/components/ui/cart-link";
import type { Category } from "@/domain/models/category";

interface SiteHeaderProps {
  categories?: Category[];
}

export function SiteHeader({ categories = [] }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const mainNav = [
    { href: "/", label: "Home" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--background)]/95 backdrop-blur">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Row 1: Logo + Search bar (desktop) / Logo + menu buttons (mobile) */}
        <div className="flex h-auto min-h-[4rem] flex-wrap content-start items-center gap-x-4 gap-y-2 py-3">
          {/* Logo */}
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

          {/* Search bar - desktop only */}
          <div className="hidden md:block">
            <SearchBar className="max-w-xl" />
          </div>

          {/* Right side: Search + Cart (desktop) */}
          <div className="ml-auto hidden md:flex shrink-0 items-center gap-2">
            <Link
              href="/search"
              className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            >
              Search products
            </Link>
            <CartLink
              className="relative rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--background)] shadow-sm transition hover:opacity-90"
            />
          </div>

          {/* Mobile: search button + cart + menu */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="rounded-full bg-[var(--surface)] p-2 text-xs font-medium ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--surface-hover)]"
              aria-label="Search products"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <CartLink
              variant="icon"
              className="relative rounded-full bg-[var(--accent)] p-2 text-xs font-semibold text-[var(--background)] shadow-sm transition hover:opacity-90"
            />
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

        {/* Row 2: Categories nav (desktop only) */}
        <nav className="hidden pb-2 md:flex flex-wrap content-start items-center gap-x-2 gap-y-2">
          {/* Home link */}
          <div className="flex items-center gap-x-1 text-xs font-medium text-[var(--foreground-muted)]">
            {mainNav.map((navItem) => (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={clsx(
                  "rounded-full px-2 py-1.5 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                  pathname === navItem.href &&
                    "bg-[var(--surface)] text-[var(--foreground)]"
                )}
              >
                {navItem.label}
              </Link>
            ))}
          </div>
          {/* Categories - allow wrap */}
          <div className="flex flex-wrap content-start items-center gap-x-1 text-xs font-medium text-[var(--foreground-muted)]">
            <CategoryDropdown categories={categories} />
          </div>
        </nav>

        {/* Mobile Search Expanded */}
        {isMobileSearchOpen && (
          <div className="pb-3 md:hidden">
            <SearchBar variant="full" className="w-full" />
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-72 bg-[var(--background)] p-4 shadow-xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Menú</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-full p-2 hover:bg-[var(--surface)]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              {mainNav.map((navItem) => (
                <Link
                  key={navItem.href}
                  href={navItem.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    "block rounded-lg px-3 py-2 text-sm font-medium",
                    "text-[var(--foreground-muted)] transition-colors",
                    "hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                    pathname === navItem.href && "bg-[var(--surface)] text-[var(--foreground)]"
                  )}
                >
                  {navItem.label}
                </Link>
              ))}
              <div className="border-t border-[var(--border-subtle)] pt-2 mt-2">
                <span className="block px-3 py-2 text-xs font-semibold text-[var(--foreground-muted)]">
                  Categorías
                </span>
                {categories.slice(0, 10).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      "block rounded-lg px-3 py-2 text-sm",
                      "text-[var(--foreground-muted)] transition-colors",
                      "hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <div className="border-t border-[var(--border-subtle)] pt-2 mt-2">
                <Link
                  href="/search"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    "block rounded-lg px-3 py-2 text-sm font-medium",
                    "text-[var(--foreground-muted)] transition-colors",
                    "hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                  )}
                >
                  Buscar productos
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    "block rounded-lg px-3 py-2 text-sm font-medium",
                    "text-[var(--foreground-muted)] transition-colors",
                    "hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                  )}
                >
                  Carrito
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
