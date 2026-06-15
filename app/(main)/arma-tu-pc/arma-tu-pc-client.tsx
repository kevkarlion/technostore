"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  Fan,
  CircuitBoard,
  Database,
  HardDrive,
  Monitor,
  Zap,
  Box,
  Keyboard,
  MousePointer2,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import type { Product } from "@/types/domain";
import { PremiumProductCardV2 } from "@/components/product-card/premium-product-card-v2";

interface CategorySection {
  slug: string;
  name: string;
  products: Product[];
}

interface Props {
  categories: CategorySection[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  microprocesadores: Cpu,
  "coolers-disipadores": Fan,
  motherboard: CircuitBoard,
  memorias: Database,
  "memorias-notebooks": Database,
  "discos-ssd": HardDrive,
  "discos-m2": HardDrive,
  "discos-hdd": HardDrive,
  "placas-de-video": Monitor,
  fuentes: Zap,
  gabinetes: Box,
  "monitores-tv": Monitor,
  "teclado-gamer": Keyboard,
  "teclados-perifericos": Keyboard,
  "mouse-gamer": MousePointer2,
  "mouse-perifericos": MousePointer2,
};

function categoryHref(slug: string) {
  return `/categorias/${slug}`;
}

function sectionId(slug: string) {
  return `cat-${slug}`;
}

export function ArmaTuPcClient({ categories }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  // Track active section for sidebar highlight
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const handleScroll = useCallback(() => {
    const offset = 10; // tolerancia mínima para el borde
    let current: string | null = null;
    for (const cat of categories) {
      const el = document.getElementById(sectionId(cat.slug));
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      // El padding del section (140px) cubre la barra sticky,
      // el título queda justo debajo. Detectar activo cuando el
      // section top está cerca o por arriba del viewport.
      if (rect.top - offset <= 0) {
        current = cat.slug;
      } else {
        break;
      }
    }
    setActiveSlug(current);
  }, [categories]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories
      .map((cat) => ({
        ...cat,
        products: cat.products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.products.length > 0);
  }, [categories, searchQuery]);

  const scrollToSection = useCallback((slug: string) => {
    const el = document.getElementById(sectionId(slug));
    if (el) {
      // El padding del section (140px) ya cubre navbar + dropdown sticky
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  const totalResults = filtered.reduce((s, c) => s + c.products.length, 0);
  const totalCategories = categories.length;

  return (
    <div className="animate-fade-in">
      {/* ───── Hero ───── */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-gray-900 to-purple-950 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Armá tu PC ideal
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-300 sm:text-lg">
            Elegí cada componente para armar la PC que siempre quisiste.
            Todo en un solo lugar, con los mejores precios.
          </p>

          {/* Search */}
          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscá componentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-800/50 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Result stats — visible when searching */}
          {searchQuery.trim() && (
            <p className="mt-3 text-sm text-indigo-200">
              {totalResults} resultado{totalResults !== 1 ? "s" : ""} en{" "}
              {filtered.length} categoría{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </section>

      {/* ── Contenedor principal: CSS Grid puro, sin posicionamiento especial ── */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1fr]">
          {/* Desktop sidebar — sticky, visible al scrollear */}
          <aside className="hidden self-start lg:block lg:sticky lg:top-36 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
                {/* Stats — arriba del nav */}
                <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
                  <p className="text-xs text-gray-400">
                    {searchQuery.trim() ? "Resultados" : "Productos"}
                  </p>
                  <p className="text-lg font-bold text-indigo-400">
                    {totalResults}
                  </p>
                  <p className="text-xs text-gray-400">
                    en {filtered.length} de {totalCategories} categorías
                  </p>
                </div>

                <nav className="mt-4 rounded-xl border border-gray-700 bg-gray-900 p-3">
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Componentes
                  </p>
                  <div className="space-y-0.5">
                    {categories.map((cat) => {
                      const Icon = ICON_MAP[cat.slug] ?? Cpu;
                      const isActive = activeSlug === cat.slug;
                      return (
                        <button
                          key={cat.slug}
                          onClick={() => scrollToSection(cat.slug)}
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-indigo-950 font-medium text-indigo-300"
                              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{cat.name}</span>
                          <span className="ml-auto text-xs tabular-nums text-gray-400">
                            {cat.products.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </aside>

          {/* Main content */}
          <main className="min-w-0">
          {/* ── Mobile sticky dropdown ── */}
          <div className="sticky top-[4.5rem] z-30 -mx-4 border-b border-gray-700 bg-gray-900 px-4 pb-3 pt-3 shadow-sm lg:hidden mb-3">
            <select
              value={activeSlug ?? ""}
              onChange={(e) => {
                if (e.target.value) scrollToSection(e.target.value);
              }}
              className="w-full appearance-none rounded-lg border border-gray-600 bg-gray-800 px-3 py-2.5 text-sm font-medium text-gray-200"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em 1.5em",
              }}
            >
              <option value="" disabled>
                {searchQuery.trim()
                  ? `${totalResults} resultado${totalResults !== 1 ? "s" : ""}`
                  : "Ir a categoría..."}
              </option>
              {filtered.map((cat) => {
                const Icon = ICON_MAP[cat.slug] ?? Cpu;
                return (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name} ({cat.products.length})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Mobile search stats */}
          {searchQuery.trim() && (
            <p className="mb-4 text-sm text-gray-500 lg:hidden">
              {totalResults} resultado{totalResults !== 1 ? "s" : ""} en{" "}
              {filtered.length} categoría{filtered.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* ── Category sections ── */}
          <div className="space-y-10 sm:space-y-12">
            {filtered.map((cat, idx) => (
              <section
                key={cat.slug}
                id={sectionId(cat.slug)}
                className={`scroll-mt-[140px] ${idx === 0 ? "pt-0" : "pt-[140px]"}`}
              >
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100 sm:text-xl">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-900/60 text-indigo-300 sm:h-8 sm:w-8">
                      {(() => {
                        const Icon = ICON_MAP[cat.slug] ?? Cpu;
                        return <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
                      })()}
                    </span>
                    {cat.name}
                    <span className="ml-1 text-sm font-normal text-gray-400">
                      ({cat.products.length})
                    </span>
                  </h2>
                  <Link
                    href={categoryHref(cat.slug)}
                    className="group flex shrink-0 items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    Ver todos
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                  {cat.products.map((product, idx) => (
                    <PremiumProductCardV2
                      key={product.id}
                      product={product}
                      index={idx}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="mb-3 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">
                No se encontraron componentes
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Probá con otro término de búsqueda
              </p>
            </div>
          )}
          </main>
        </div>
      </div>
    </div>
  );
}
