"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
                "hover:text-[var(--accent)]"
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
  const [scrollY, setScrollY] = useState(0);

  // Scroll handler for blur/shadow effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isBlurred = scrollY >= 50;
  const hasShadow = scrollY >= 100;

  // Dynamic styles based on scroll position
  const headerStyles: React.CSSProperties = isBlurred
    ? {
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        backgroundColor: "rgba(12, 12, 16, 0.95)",
        transition: "all 0.3s ease",
      }
    : {
        backdropFilter: "none",
        backgroundColor: "rgba(12, 12, 16, 0)",
        transition: "all 0.3s ease",
      };

  const headerWithShadowStyles: React.CSSProperties = hasShadow
    ? {
        ...headerStyles,
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
      }
    : headerStyles;

  const mainNav = [
    { href: "/", label: "Home" },
  ];

  const handleNavigate = () => {
    setIsMobileMenuOpen(false);
    setExpandedCategory(null);
  };

  return (
    <header 
      className="sticky top-0 z-[60] w-full border-b border-[var(--border-subtle)]/50 backdrop-blur-xl"
      style={headerWithShadowStyles}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Row 1: Logo + Search bar (desktop) / Logo + menu buttons (mobile) */}
        <div className="flex h-auto min-h-[4.5rem] flex-wrap content-center items-center gap-x-4 gap-y-2 py-2">
          {/* Logo - más grande y prominente */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 transition-transform hover:scale-[1.02]"
            aria-label="TechnoStore home"
          >
            <span className="relative h-12 w-auto sm:h-14">
              <Image
                src="/logo2.png"
                alt="TechnoStore"
                width={140}
                height={56}
                className="block h-12 w-auto object-contain object-left sm:hidden"
                priority
              />
              <Image
                src="/logo-texto.png"
                alt="TechnoStore"
                width={220}
                height={56}
                className="hidden h-14 w-auto object-contain object-left sm:block"
                priority
              />
            </span>
          </Link>

          {/* Search bar - desktop only - ahora más prominence */}
          <div className="hidden lg:block flex-1 max-w-xl mx-4">
            <SearchBar className="w-full" />
          </div>

          {/* Right side: Search + Cart (desktop) - premium buttons */}
          <div className="ml-auto hidden lg:flex shrink-0 items-center gap-3">
            {/* CTA Promocional */}
            <Link
              href="/search?badge=hot"
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-purple)] px-4 py-2 text-xs font-semibold text-[var(--background)] transition-all hover:shadow-lg hover:shadow-[var(--accent)]/25"
            >
              <span className="relative z-10">Hot Sale</span>
            </Link>
            
            {/* Buscar */}
            <Link
              href="/search"
              className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-medium ring-1 ring-[var(--border-subtle)] transition-all hover:bg-[var(--surface-hover)] hover:ring-[var(--accent)]/50 hover:scale-[1.02]"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </span>
            </Link>
            
            {/* Cart premium */}
            <CartLink
              className="relative rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--background)] shadow-lg shadow-[var(--accent)]/20 transition-all hover:scale-[1.05] hover:shadow-xl"
            />
          </div>

          {/* Mobile: search button + cart + menu - premium */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            {/* Cart mobile */}
            <CartLink
              variant="icon"
              className="relative rounded-full bg-[var(--accent)] p-2.5 text-sm font-bold text-[var(--background)] shadow-lg transition-all hover:scale-110"
            />
            {/* Menu button premium */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-full bg-[var(--surface)] p-2.5 ring-1 ring-[var(--border-subtle)] transition-all hover:bg-[var(--surface-hover)] hover:ring-[var(--accent)]/50"
              aria-label="Toggle menu"
            >
              <motion.svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <motion.path
                  initial={false}
                  animate={isMobileMenuOpen ? "open" : "closed"}
                  variants={{
                    open: { d: "M6 18L18 6M6 6l12 12", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 2 },
                    closed: { d: "M4 6h16M4 12h16M4 18h16", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 2 }
                  }}
                />
              </motion.svg>
            </button>
          </div>
        </div>

        {/* Row 2: Categories nav (desktop only) - premium styled */}
        <nav className="hidden pb-3 lg:flex flex-wrap content-center items-center gap-x-1.5 gap-y-1">
          {/* Home link - destacado */}
          <div className="flex items-center gap-x-1 text-sm font-medium">
            {mainNav.map((navItem) => (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={clsx(
                  "rounded-full px-4 py-2 transition-all",
                  pathname === navItem.href
                    ? "bg-[var(--accent)] text-[var(--background)] font-semibold"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:text-[var(--accent)]"
                )}
              >
                {navItem.label}
              </Link>
            ))}
          </div>
          
          {/* Divider */}
          <div className="h-4 w-px bg-[var(--border-subtle)] mx-1"></div>
          
          {/* Categories - premium styled con gradientes */}
          <div className="flex flex-wrap content-center items-center gap-x-1 text-sm font-medium">
            {JOTAKP_CATEGORIES.map((cat, index) => (
              <div key={cat.slug} className="relative group">
                <button
                  type="button"
                  className={clsx(
                    "flex items-center gap-1 rounded-full px-3 py-1.5 cursor-default",
                    "text-[var(--foreground-muted)] transition-colors",
                    "hover:bg-[var(--surface)] hover:text-[var(--accent)]"
                  )}
                >
                  {cat.name}
                  <svg
                    className="h-3.5 w-3.5 transition-transform group-hover:rotate-180"
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
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
                          "text-[var(--foreground-muted)] transition-all",
                          "hover:bg-[var(--surface)] hover:text-[var(--accent)] hover:translate-x-1"
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]/50"></span>
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {/* Right side extra links */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/products/armatuPC"
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--accent)] transition-all hover:bg-[var(--accent)]/10"
            >
              Armá tu PC
            </Link>
          </div>
        </nav>

        {/* Mobile Search Expanded */}
        {isMobileSearchOpen && (
          <div className="pb-3 lg:hidden">
            <SearchBar variant="full" className="w-full" />
          </div>
        )}
      </div>

      {/* Mobile Drawer - Full menu with all categories and subcategories - Premium */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleNavigate}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-[85%] max-w-[320px] bg-[var(--background)] z-[100] overflow-y-auto border-l border-[var(--border-subtle)]"
          >
            {/* Header - Premium */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--background)] px-5 py-4">
              <span className="text-lg font-bold text-[var(--foreground)]">Menú</span>
              <button 
                onClick={handleNavigate}
                className="rounded-full bg-[var(--surface)] p-2 text-[var(--foreground)] transition-all hover:bg-[var(--surface-hover)]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Main Links - Premium styled */}
            <div className="border-b border-[var(--border-subtle)]">
              {mainNav.map((navItem) => (
                <Link
                  key={navItem.href}
                  href={navItem.href}
                  onClick={handleNavigate}
                  className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
                >
                  {navItem.label}
                </Link>
              ))}
              <Link href="/search" onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
                Buscar productos
              </Link>
              <Link href="/cart" onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
                Mi carrito
              </Link>
              <Link href="/products/armatuPC" onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface)]">
                Armá tu PC
              </Link>
            </div>

            {/* Categories - Premium with icons */}
            <div className="py-2">
              <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                Categorías
              </div>
              {JOTAKP_CATEGORIES.map((category, index) => (
                <div key={category.slug} className="border-b border-[var(--border-subtle)]/50">
                  {category.subcategories.length > 0 ? (
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.slug ? null : category.slug)}
                      className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
                    >
                      <span className="flex items-center gap-3">
                        {category.name}
                      </span>
                      <motion.svg
                        className="h-4 w-4 text-[var(--foreground-muted)]"
                        animate={{ rotate: expandedCategory === category.slug ? 180 : 0 }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>
                  ) : (
                    <Link href={`/category/${category.slug}`} onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
                      {category.name}
                    </Link>
                  )}
                  {/* Subcategories - Animated expand */}
                  <AnimatePresence>
                    {expandedCategory === category.slug && category.subcategories.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-[var(--surface)]"
                      >
                        <div className="px-5 pb-3">
                          {category.subcategories.map((sub) => (
                            <Link 
                              key={sub.slug} 
                              href={`/category/${sub.slug}`}
                              onClick={handleNavigate}
                              className="flex items-center gap-2 py-2.5 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--accent)]"
                            >
                              <span className="h-1 w-1 rounded-full bg-[var(--accent)]"></span>
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            
            {/* Footer - Promo */}
            <div className="border-t border-[var(--border-subtle)] p-5">
              <Link 
                href="/search?badge=hot" 
                onClick={handleNavigate}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-purple)] py-3 text-sm font-bold text-[var(--background)]"
              >
                Ver Hot Sale
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </header>
  );
}
