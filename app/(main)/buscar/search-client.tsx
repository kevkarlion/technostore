"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Sparkles, Zap } from "lucide-react";
import { PremiumProductCardV2 } from "@/components/product-card/premium-product-card-v2";
import type { Product } from "@/types/domain";

interface SearchMeta {
  query: string;
  tokens: {
    capacity: string | null;
    formFactor: string | null;
    productType: string | null;
    brand: string | null;
    model: string | null;
  };
  fuzzyUsed: boolean;
  synonymsUsed: boolean;
}

interface SearchClientProps {
  initialProducts: Product[];
  initialQuery: string;
  initialTotal?: number;
  initialPage?: number;
  searchMeta?: SearchMeta | null;
}

export function SearchClient({
  initialProducts,
  initialQuery,
  initialTotal = 0,
  initialPage = 1,
  searchMeta,
}: SearchClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const limit = 20;
  const totalPages = Math.ceil(initialTotal / limit);
  const startItem = (initialPage - 1) * limit + 1;
  const endItem = Math.min(initialPage * limit, initialTotal);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      params.set("page", "1");
      router.push(`/buscar?${params.toString()}`);
    },
    [query, router]
  );

  const goToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams();
      if (initialQuery) params.set("q", initialQuery);
      params.set("page", newPage.toString());
      router.push(`/buscar?${params.toString()}`);
    },
    [router, initialQuery]
  );

  const detectedTokens = searchMeta?.tokens;
  const hasDetectedFilters =
    detectedTokens &&
    (detectedTokens.brand || detectedTokens.productType || detectedTokens.capacity);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
            Buscar productos
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Encuentra laptops, componentes y periféricos en todo nuestro catálogo
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, marca o categoría..."
              aria-label="Buscar productos"
              className="pl-12 pr-4 py-4 rounded-2xl border-zinc-700/50 bg-zinc-900/80 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--accent)] focus:ring-[var(--accent)]"
            />
          </div>
        </form>
      </header>

      {/* Search intelligence badges */}
      {searchMeta && initialQuery && hasDetectedFilters && (
        <div className="flex flex-wrap items-center gap-2 justify-center max-w-2xl mx-auto">
          {searchMeta.fuzzyUsed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              Búsqueda aproximada
            </span>
          )}
          {searchMeta.synonymsUsed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Zap className="w-3 h-3" />
              Sinónimos aplicados
            </span>
          )}
          {detectedTokens.brand && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Marca: {detectedTokens.brand}
            </span>
          )}
          {detectedTokens.productType && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Tipo: {detectedTokens.productType}
            </span>
          )}
          {detectedTokens.capacity && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Capacidad: {detectedTokens.capacity}
            </span>
          )}
        </div>
      )}

      {/* Results */}
      <section className="space-y-6">
        <p className="text-sm text-[var(--foreground-muted)]">
          {initialQuery
            ? `Mostrando ${startItem}-${endItem} de ${initialTotal} resultados para "${initialQuery}"`
            : `Mostrando ${startItem}-${endItem} de ${initialTotal} productos`}
        </p>

        {initialProducts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-[var(--foreground-muted)]" />
            </div>
            <p className="text-[var(--foreground-muted)]">
              {initialQuery
                ? `No encontramos productos para "${initialQuery}". Probá con otro término.`
                : "No hay productos disponibles."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {initialProducts.map((product, index) => (
                <PremiumProductCardV2
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                <button
                  onClick={() => goToPage(initialPage - 1)}
                  disabled={initialPage <= 1}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--border-subtle)] transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-[var(--foreground-muted)] px-4">
                  Página {initialPage} de {totalPages}
                </span>
                <button
                  onClick={() => goToPage(initialPage + 1)}
                  disabled={initialPage >= totalPages}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--border-subtle)] transition-colors"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
