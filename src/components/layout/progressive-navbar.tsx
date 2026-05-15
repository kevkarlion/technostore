"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { Search, ShoppingCart, Menu, X, ChevronDown, User } from "lucide-react";
import { CartLink } from "@/components/ui/carrito-link";
import { SearchBar } from "@/components/ui/search-bar";
import { JOTAKP_CATEGORIES } from "@/components/ui/category-dropdown";
import { useCartStore } from "@/store/cart-store";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCROLL_THRESHOLD = 80; // Cuando se activa el navbar compacto
const SCROLL_HYSTERESIS = 20; // Para evitar transiciones频繁
const HEADER_TRANSITION_DURATION = 0.35;

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const headerVariants = {
  expanded: {
    height: "auto",
    opacity: 1,
  },
  collapsed: {
    height: 64,
    opacity: 1,
  },
};

const contentVariants = {
  expanded: { opacity: 1, y: 0 },
  collapsed: { opacity: 0, y: -10 },
};

const logoVariants = {
  expanded: { scale: 1 },
  collapsed: { scale: 0.85 },
};

// ============================================================================
// TYPES
// ============================================================================

interface MobileCategory {
  name: string;
  slug: string;
  subcategories: { name: string; slug: string }[];
}

// ============================================================================
// HOOK: USE SCROLL TRACKING
// ============================================================================

function useScrollTracking() {
  const [scrollState, setScrollState] = useState<"top" | "scrolled">("top");
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const [direction, setDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine direction
      if (currentScrollY > lastScrollY.current + 2) {
        setDirection("down");
      } else if (currentScrollY < lastScrollY.current - 2) {
        setDirection("up");
      }
      
      // Determine state based on scroll position
      const newState = currentScrollY > SCROLL_THRESHOLD ? "scrolled" : "top";
      
      // Only update if state changes (with hysteresis)
      if (newState !== scrollState) {
        // If going back to top, always allow
        if (newState === "top" || currentScrollY < lastScrollY.current) {
          setScrollState(newState);
        }
      }

      setScrollY(currentScrollY);
      lastScrollY.current = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollState]);

  return { scrollState, scrollY, direction };
}

// ============================================================================
// MOBILE MENU DRAWER
// ============================================================================

function MobileDrawer({
  isOpen,
  onClose,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: MobileCategory[];
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleNavigate = () => {
    onClose();
    setExpandedCategory(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleNavigate}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[85%] max-w-[340px] bg-[var(--background)] border-l border-[var(--border-subtle)] z-[101] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--background)]/90 backdrop-blur-xl px-5 py-4">
              <span className="text-lg font-bold text-[var(--foreground)]">Menú</span>
              <button
                onClick={handleNavigate}
                className="rounded-full bg-[var(--surface)] p-2 text-[var(--foreground)] transition-all hover:bg-[var(--surface-hover)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Links */}
            <div className="border-b border-[var(--border-subtle)]">
              <Link
                href="/"
                onClick={handleNavigate}
                className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
              >
                Inicio
              </Link>
              <Link
                href="/search"
                onClick={handleNavigate}
                className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
              >
                <Search className="h-4 w-4" />
                Buscar productos
              </Link>
              <Link
                href="/carrito"
                onClick={handleNavigate}
                className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
              >
                <ShoppingCart className="h-4 w-4" />
                Mi carrito
              </Link>
            </div>

            {/* Categories */}
            <div className="py-2">
              <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                Categorías
              </div>
              {categories.map((category) => (
                <div key={category.slug} className="border-b border-[var(--border-subtle)]/50">
                  {category.subcategories.length > 0 ? (
                    <button
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === category.slug ? null : category.slug
                        )
                      }
                      className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
                    >
                      <span>{category.name}</span>
                      <motion.div
                        animate={{ rotate: expandedCategory === category.slug ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
                      </motion.div>
                    </button>
                  ) : (
                    <Link
                      href={`/category/${category.slug}`}
                      onClick={handleNavigate}
                      className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
                    >
                      {category.name}
                    </Link>
                  )}
                  
                  {/* Subcategories */}
                  <AnimatePresence>
                    {expandedCategory === category.slug && (
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
                              <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
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

            {/* CTA */}
            <div className="border-t border-[var(--border-subtle)] p-5">
              <Link
                href="/search?badge=hot"
                onClick={handleNavigate}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-purple)] py-3 text-sm font-bold text-[var(--background)]"
              >
                🔥 Ver Hot Sale
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// NAVBAR COMPACTO (SCROLL STATE)
// ============================================================================

function CompactNavbar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 right-0 top-0 z-[70] h-16 border-b border-[var(--border-subtle)] bg-[var(--background)]"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        {/* Logo Compacto */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-auto relative">
            <Image
              src="/logo2.png"
              alt="TechnoStore"
              width={100}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>
        </Link>

        {/* Search Compacto */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
          <SearchBar className="w-full" />
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Search mobile */}
          <Link
            href="/search"
            className="flex md:hidden items-center justify-center w-9 h-9 rounded-full bg-[var(--surface)]"
          >
            <Search className="h-4 w-4 text-[var(--foreground)]" />
          </Link>
          
          {/* Cart */}
          <CartLink
            variant="icon"
            className="relative rounded-full bg-[var(--accent)] p-2 text-[var(--background)]"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// NAVBAR PRINCIPAL (EXPANDED STATE)
// ============================================================================

function ExpandedNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Fila 1: Logo + Search + Acciones */}
        <div className="flex flex-wrap content-center items-center gap-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="h-12 w-auto relative">
              <Image
                src="/logo2.png"
                alt="TechnoStore"
                width={140}
                height={48}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* Search Desktop */}
          <div className="hidden lg:block flex-1 max-w-xl">
            <SearchBar className="w-full" />
          </div>

          {/* Acciones Derecha */}
          <div className="ml-auto hidden lg:flex items-center gap-3">
            {/* Hot Sale CTA */}
            <Link
              href="/search?badge=hot"
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-purple)] px-4 py-2 text-xs font-semibold text-[var(--background)] transition-all hover:shadow-lg hover:shadow-[var(--accent)]/25"
            >
              <span className="relative z-10">🔥 Hot Sale</span>
            </Link>

            {/* Cart */}
            <CartLink className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--background)] shadow-lg shadow-[var(--accent)]/20 transition-all hover:scale-105 hover:shadow-xl" />
          </div>

          {/* Mobile: Acciones */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <Link
              href="/search"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)]"
            >
              <Search className="h-4 w-4 text-[var(--foreground)]" />
            </Link>
            <CartLink variant="icon" className="relative rounded-full bg-[var(--accent)] p-2.5 text-[var(--background)]" />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] ring-1 ring-[var(--border-subtle)]"
            >
              <Menu className="h-5 w-5 text-[var(--foreground)]" />
            </button>
          </div>
        </div>

        {/* Fila 2: Navegación de Categorías (Desktop) */}
        <nav className="hidden pb-3 lg:flex flex-wrap content-center items-center gap-x-2">
          {/* Home */}
          <Link
            href="/"
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              pathname === "/"
                ? "bg-[var(--accent)] text-[var(--background)] font-semibold"
                : "text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:text-[var(--accent)]"
            )}
          >
            Inicio
          </Link>

          <div className="h-5 w-px bg-[var(--border-subtle)]" />

          {/* Categorías */}
          {JOTAKP_CATEGORIES.map((cat) => (
            <div key={cat.slug} className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--accent)]"
              >
                {cat.name}
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
              </button>
              
              {/* Dropdown */}
              <ul className="pointer-events-none absolute left-0 top-full z-50 mt-0 min-w-[200px] rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] p-1 opacity-0 shadow-xl shadow-black/20 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                {cat.subcategories.map((sub) => (
                  <li key={sub.slug}>
                    <Link
                      href={`/category/${sub.slug}`}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[var(--foreground-muted)] transition-all hover:bg-[var(--surface)] hover:text-[var(--accent)] hover:translate-x-1"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]/50" />
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={JOTAKP_CATEGORIES}
      />
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ProgressiveNavbar - Sistema de navegación dinámica con dos estados
 * 
 * Estado EXPANDIDO (top): Navbar completo con branding, búsqueda, categorías
 * Estado COMPACTO (scroll): Navbar minimalista, siempre visible, optimizado para navegación rápida
 * 
 * Características:
 * - Transiciones suaves entre estados
 * - Scroll direction detection (hide on scroll down, show on scroll up)
 * - Mobile-first con drawer optimizado
 * - Backdrop blur premium
 * - Performance optimizada con requestAnimationFrame
 */
export function ProgressiveNavbar() {
  const { scrollState, scrollY, direction } = useScrollTracking();
  const [showCompact, setShowCompact] = useState(false);

  // Control when to show compact navbar
  useEffect(() => {
    if (scrollState === "scrolled" && direction === "down") {
      setShowCompact(true);
    } else if (scrollState === "top" || direction === "up") {
      setShowCompact(false);
    }
  }, [scrollState, direction]);

  // Don't show compact at very top
  useEffect(() => {
    if (scrollY < 20) {
      setShowCompact(false);
    }
  }, [scrollY]);

  return (
    <>
      {/* Navbar Expandido (Principal) - siempre presente pero puede estar oculto */}
      <motion.header
        initial="expanded"
        animate={showCompact ? "collapsed" : "expanded"}
        variants={headerVariants}
        className={clsx(
          "sticky top-0 z-[60] w-full border-b border-[var(--border-subtle)]",
          "bg-[var(--background)]/95 backdrop-blur-xl",
          "transition-all duration-300",
          // Cuando está compactado, se oculta visualmente pero el layout sigue
          showCompact && "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100"
        )}
      >
        <ExpandedNavbar />
      </motion.header>

      {/* Navbar Compacto - solo visible cuando hace scroll */}
      <AnimatePresence>
        {showCompact && (
          <CompactNavbar />
        )}
      </AnimatePresence>

      {/* Spacer para compensar cuando el navbar compacto está activo */}
      {showCompact && (
        <div className="h-16 w-full lg:hidden" />
      )}
    </>
  );
}

export default ProgressiveNavbar;