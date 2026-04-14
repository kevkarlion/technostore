"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { SearchBar } from "@/components/ui/search-bar";
import { CartLink } from "@/components/ui/cart-link";
import { JOTAKP_CATEGORIES, type Category } from "@/components/ui/category-dropdown";

interface SiteHeaderProps {
  categories?: Category[];
}

interface MobileCategory {
  name: string;
  slug: string;
  subcategories: { name: string; slug: string }[];
}

function MobileCategoryItem({
  category,
  expandedCategory,
  setExpandedCategory,
  onNavigate,
}: {
  category: MobileCategory;
  expandedCategory: string | null;
  setExpandedCategory: (slug: string | null) => void;
  onNavigate: () => void;
}) {
  const hasSubcategories = category.subcategories.length > 0;
  const isExpanded = expandedCategory === category.slug;

  return (
    <div className="border-b border-[var(--border-subtle)]">
      <div className="flex items-center justify-between">
        {hasSubcategories ? (
          <button
            onClick={() => setExpandedCategory(isExpanded ? null : category.slug)}
            className={clsx(
              "flex flex-1 items-center justify-between px-4 py-3 text-sm font-medium",
              "text-[var(--foreground)] transition-colors",
              "hover:bg-[var(--surface)]"
            )}
          >
            {category.name}
            <svg
              className={clsx("h-4 w-4 transition-transform", isExpanded && "rotate-180")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <Link
            href={`/category/${category.slug}`}
            onClick={onNavigate}
            className={clsx(
              "flex flex-1 px-4 py-3 text-sm font-medium",
              "text-[var(--foreground)] transition-colors",
              "hover:bg-[var(--surface)]"
            )}
          >
            {category.name}
          </Link>
        )}
      </div>
      {hasSubcategories && isExpanded && (
        <div className="bg-[var(--surface)] px-4 pb-3">
          {category.subcategories.map((sub) => (
            <Link
              key={sub.slug}
              href={`/category/${sub.slug}`}
              onClick={onNavigate}
              className={clsx(
                "block py-2 text-sm",
                "text-[var(--foreground-muted)] transition-colors",
                "hover:text-[var(--foreground)]"
              )}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteHeader({ categories = [] }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const mainNav = [
    { href: "/", label: "Home" },
  ];

  const handleNavigate = () => {
    setIsMobileMenuOpen(false);
    setExpandedCategory(null);
  };

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-[var(--border-subtle)] bg-[var(--background)]/95 backdrop-blur">
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
          <div className="hidden lg:block">
            <SearchBar className="max-w-xl" />
          </div>

          {/* Right side: Search + Cart (desktop) */}
          <div className="ml-auto hidden lg:flex shrink-0 items-center gap-2">
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
          <div className="ml-auto flex items-center gap-2 lg:hidden">
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
        <nav className="hidden pb-2 lg:flex flex-wrap content-start items-center gap-x-2 gap-y-2">
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
          {/* Categories - use static JOTAKP_CATEGORIES for desktop too */}
          <div className="flex flex-wrap content-start items-center gap-x-1 text-xs font-medium text-[var(--foreground-muted)]">
            {JOTAKP_CATEGORIES.map((cat) => (
              <div key={cat.slug} className="relative group">
                <button
                  type="button"
                  className={clsx(
                    "flex items-center gap-1 rounded-full px-3 py-1.5 cursor-default",
                    "text-[var(--foreground-muted)] transition-colors",
                    "hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                  )}
                >
                  {cat.name}
                  <svg
                    className="h-3 w-3 transition-transform group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Submenu dropdown */}
                <ul className="pointer-events-none absolute left-0 top-full z-50 mt-0 min-w-[180px] rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-1 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  {cat.subcategories.map((sub) => (
                    <li key={sub.slug}>
                      <Link
                        href={`/category/${sub.slug}`}
                        className={clsx(
                          "flex w-full rounded-md px-2 py-1.5 text-xs",
                          "text-[var(--foreground-muted)] transition-colors",
                          "hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                        )}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Mobile Search Expanded */}
        {isMobileSearchOpen && (
          <div className="pb-3 lg:hidden">
            <SearchBar variant="full" className="w-full" />
          </div>
        )}
      </div>

      {/* Mobile Drawer - Full menu with all categories and subcategories */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleNavigate}
          />
          {/* Drawer - simplified styles that work */}
          <div className="fixed right-0 top-0 h-screen w-80 bg-[#0c0c10] z-[100] overflow-y-auto border-l border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <span className="text-lg font-semibold text-[#e8e8ec]">Menú</span>
              <button 
                onClick={handleNavigate}
                className="p-2 rounded-full hover:bg-white/10 text-[#e8e8ec]"
              >
                ✕
              </button>
            </div>
            
            {/* Main Links */}
            <div className="border-b border-white/10">
              {mainNav.map((navItem) => (
                <Link
                  key={navItem.href}
                  href={navItem.href}
                  onClick={handleNavigate}
                  className="block px-4 py-3 text-sm text-[#e8e8ec] hover:bg-white/10"
                >
                  {navItem.label}
                </Link>
              ))}
              <Link href="/search" onClick={handleNavigate} className="block px-4 py-3 text-sm text-[#e8e8ec] hover:bg-white/10">
                Buscar productos
              </Link>
              <Link href="/cart" onClick={handleNavigate} className="block px-4 py-3 text-sm text-[#e8e8ec] hover:bg-white/10">
                Carrito
              </Link>
            </div>

            {/* Categories */}
            <div>
              <div className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase">
                Categorías
              </div>
              {JOTAKP_CATEGORIES.map((category) => (
                <div key={category.slug} className="border-b border-white/5">
                  {category.subcategories.length > 0 ? (
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.slug ? null : category.slug)}
                      className="flex w-full items-center justify-between px-4 py-3 text-sm text-[#e8e8ec] hover:bg-white/10"
                    >
                      {category.name}
                      <span className="text-[#9ca3af]">{expandedCategory === category.slug ? '▼' : '▶'}</span>
                    </button>
                  ) : (
                    <Link href={`/category/${category.slug}`} onClick={handleNavigate} className="block px-4 py-3 text-sm text-[#e8e8ec] hover:bg-white/10">
                      {category.name}
                    </Link>
                  )}
                  {/* Subcategories */}
                  {expandedCategory === category.slug && category.subcategories.length > 0 && (
                    <div className="bg-white/5 px-4 pb-3">
                      {category.subcategories.map((sub) => (
                        <Link 
                          key={sub.slug} 
                          href={`/category/${sub.slug}`}
                          onClick={handleNavigate}
                          className="block py-2 text-sm text-[#9ca3af] hover:text-[#e8e8ec]"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
