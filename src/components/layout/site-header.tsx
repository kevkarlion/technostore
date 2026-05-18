"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { SearchBar } from "@/components/ui/search-bar";
import { CartLink } from "@/components/ui/cart-link";
import { FavoritesLink } from "@/components/ui/favorites-link";
import { JOTAKP_CATEGORIES } from "@/components/ui/category-dropdown";
import type { Category } from "@/domain/models/category";
import { Menu, Search } from "lucide-react";

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
            href={`/categorias/${category.slug}`}
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
              href={`/categorias/${sub.slug}`}
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
        {/* Row 1: Top bar - Redes Sociales */}
        <div className="hidden lg:flex items-center justify-center py-2 border-b border-[var(--border-subtle)]/30">
          {/* Redes Sociales */}
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--foreground-muted)] transition-colors hover:text-[#E4405F]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--foreground-muted)] transition-colors hover:text-[#1877F2]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://wa.me/5491112345678"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--foreground-muted)] transition-colors hover:text-[#25D366]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.162-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Row 2: Logo + Search bar */}
        <div className="flex h-auto min-h-[4.5rem] flex-wrap content-center items-center gap-x-4 gap-y-2 py-2">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 transition-transform hover:scale-[1.02]"
            aria-label="TechnoStore home"
          >
            <span className="relative h-12 w-auto sm:h-14">
              <Image
                src="/logo-texto.png"
                alt="TechnoStore"
                width={160}
                height={48}
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

          {/* Search bar - única barra - desktop only */}
          <div className="hidden lg:block flex-1 max-w-xl mx-4">
            <SearchBar className="w-full" />
          </div>

          {/* Cart + Favorites desktop */}
          <div className="ml-auto hidden lg:flex items-center gap-3 shrink-0">
            <FavoritesLink
              variant="icon"
              className="rounded-full bg-[var(--surface)] p-2.5 ring-1 ring-[var(--border-subtle)] text-[var(--foreground)] hover:text-red-400 hover:ring-red-400/50 transition-all"
            />
            <CartLink
              className="relative rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--background)] shadow-lg shadow-[var(--accent)]/20 transition-all hover:scale-[1.05] hover:shadow-xl"
            />
          </div>

          {/* Mobile: favorites + cart + menu */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="rounded-full bg-[var(--surface)] p-2.5 ring-1 ring-[var(--border-subtle)]"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>
            <FavoritesLink
              variant="icon"
              className="rounded-full bg-[var(--surface)] p-2.5 ring-1 ring-[var(--border-subtle)] text-[var(--foreground)]"
            />
            <CartLink
              variant="icon"
              className="relative rounded-full bg-[var(--accent)] p-2.5 text-sm font-bold text-[var(--background)] shadow-lg transition-all hover:scale-110"
            />
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

        {/* Row 3: Categories nav (sin Home) */}
        <nav className="hidden pb-3 lg:flex flex-wrap content-center items-center gap-x-1.5 gap-y-1">
          {/* Categories - langsung tanpa Home */}
          <div className="flex flex-wrap content-center items-center gap-x-1 text-sm font-medium">
            {JOTAKP_CATEGORIES.map((cat) => (
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
                <ul className="pointer-events-none absolute left-0 top-full z-50 mt-0 min-w-[200px] max-h-[60vh] overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-1 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  {cat.subcategories.map((sub) => (
                    <li key={sub.slug}>
                      <Link
                        href={`/categorias/${sub.slug}`}
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
              <Link href="/buscar" onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
                Buscar productos
              </Link>
              <Link href="/favoritos" onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
                Mis favoritos
              </Link>
              <Link href="/carrito" onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
                Mi carrito
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
                    <Link href={`/categorias/${category.slug}`} onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
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
                              href={`/categorias/${sub.slug}`}
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
            
            
          </motion.div>
        </div>
      )}
    </header>
  );
}
