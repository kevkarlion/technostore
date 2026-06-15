"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { SearchBar } from "@/components/ui/search-bar";
import { CartLink } from "@/components/ui/cart-link";
import { FavoritesLink } from "@/components/ui/favorites-link";
import { JOTAKP_CATEGORIES } from "@/components/ui/category-dropdown";
import { Cpu, Menu, Search } from "lucide-react";
import { isCatalogMode } from "@/lib/catalog-mode";

const SCROLL_THRESHOLD = 80;

export function ScrollNavbar() {
  const catalogMode = isCatalogMode();
  const [isVisible, setIsVisible] = useState(false);
  const lastScrollYRef = useRef(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > SCROLL_THRESHOLD && currentScrollY > lastScrollYRef.current) {
        setIsVisible(true);
      } 
      else if (currentScrollY < SCROLL_THRESHOLD || currentScrollY < lastScrollYRef.current) {
        setIsVisible(false);
      }
      
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigate = () => {
    setIsMobileMenuOpen(false);
    setExpandedCategory(null);
  };

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-x-0 top-0 z-[70] border-b border-[var(--border-subtle)]/80 bg-[var(--background)]"
          >
            <div className="w-full px-4 sm:px-6 lg:px-8">
              {/* Línea 1: Logo + Search bar */}
              <div className="flex h-auto min-h-[3.5rem] flex-wrap content-center items-center gap-x-4 gap-y-2 py-2">
                {/* Logo */}
                <Link
                  href="/"
                  className="flex shrink-0 items-center gap-3 transition-transform hover:scale-[1.02]"
                  aria-label="TechnoStore home"
                >
                  <span className="inline-flex h-10 w-auto items-center">
                    <Image
                      src="/logo-texto.webp"
                      alt="TechnoStore"
                      width={280}
                      height={112}
                      className="h-full w-auto object-contain"
                      priority
                      sizes="100px"
                    />
                  </span>
                </Link>

                {/* Botón de búsqueda + Redes Sociales - desktop */}
                <div className="hidden lg:flex ml-auto items-center gap-3">
                  <button
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="rounded-full bg-[var(--surface)] p-2.5 ring-1 ring-[var(--border-subtle)] hover:bg-[var(--surface-hover)]"
                    aria-label="Buscar"
                  >
                    <Search className="h-5 w-5" />
                  </button>

                  {/* Armá tu PC — junto a la lupa */}
                  <Link
                    href="/arma-tu-pc"
                    className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-[var(--background)] transition-all hover:scale-[1.04] hover:shadow-lg hover:shadow-[var(--accent)]/30"
                  >
                    <Cpu className="h-4 w-4" />
                    Armá tu PC
                  </Link>

                  {/* Redes Sociales */}
                  <div className="flex items-center gap-1">
                    <a href="https://www.instagram.com/technostore.gr?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="text-[var(--foreground-muted)] transition-colors hover:text-[#E4405F] p-2">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    <a href="https://wa.me/5492984130230" target="_blank" rel="noopener noreferrer" className="text-[var(--foreground-muted)] transition-colors hover:text-[#25D366] p-2">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.162-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  </div>

                  {/* Favoritos */}
                  <FavoritesLink
                    variant="icon"
                    className="rounded-full bg-[var(--surface)] p-2.5 text-[var(--foreground)] ring-1 ring-[var(--border-subtle)] hover:text-red-400 hover:ring-red-400/50"
                  />

                  {/* Carrito */}
                  {!catalogMode && (
                    <CartLink
                      variant="icon"
                      className="relative rounded-full bg-[var(--accent)] p-2.5 text-[var(--background)] shadow-lg"
                    />
                  )}
                </div>

                {/* Mobile: favorites + cart + menu */}
                <div className="ml-auto flex items-center gap-2 lg:hidden">
                  <button
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="rounded-full bg-[var(--surface)] p-2.5 ring-1 ring-[var(--border-subtle)]"
                    aria-label="Buscar"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  <FavoritesLink
                    variant="icon"
                    className="rounded-full bg-[var(--surface)] p-2.5 text-[var(--foreground)] ring-1 ring-[var(--border-subtle)]"
                  />
                  {!catalogMode && (
                    <CartLink
                      variant="icon"
                      className="relative rounded-full bg-[var(--accent)] p-2.5 text-[var(--background)] shadow-lg"
                    />
                  )}
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="rounded-full bg-[var(--surface)] p-2.5 ring-1 ring-[var(--border-subtle)]"
                    aria-label="Toggle menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Línea 2: Categorías (desktop) */}
              <nav className="hidden pb-3 lg:flex flex-wrap content-center items-center gap-x-1.5 gap-y-1">
                {/* Categories */}
                <div className="flex flex-wrap content-center items-center gap-x-1 text-sm font-medium">
                  {JOTAKP_CATEGORIES.map((cat, idx) => (
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
                      <ul className={`pointer-events-none absolute top-full z-50 mt-0 min-w-[200px] max-h-[60vh] overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-1 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 ${idx === JOTAKP_CATEGORIES.length - 1 ? 'right-0' : 'left-0'}`}>
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

              {/* Search Bar - desplegable */}
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pb-3"
                  >
                    <SearchBar className="w-full" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleNavigate}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-dvh w-[85%] max-w-[320px] bg-[var(--background)] z-[100] overflow-y-auto border-l border-[var(--border-subtle)] pb-[max(env(safe-area-inset-bottom),1.5rem)] [&>*]:oversc-contain"
            >
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
              
              <div className="border-b border-[var(--border-subtle)]">
                <Link href="/" onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
                  Inicio
                </Link>
                <Link href="/buscar" onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
                  Buscar productos
                </Link>
                {!catalogMode && (
                  <Link href="/carrito" onClick={handleNavigate} className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]">
                    Mi carrito
                  </Link>
                )}
              </div>

              {/* Armá tu PC — destacado mobile */}
              <div className="px-4 py-3">
                <Link
                  href="/arma-tu-pc"
                  onClick={handleNavigate}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--background)] shadow-lg shadow-[var(--accent)]/30"
                >
                  <Cpu className="h-4 w-4" />
                  Armá tu PC
                </Link>
              </div>

              <div className="py-2">
                <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                  Categorías
                </div>
                {JOTAKP_CATEGORIES.map((category) => (
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
      </AnimatePresence>
    </>
  );
}