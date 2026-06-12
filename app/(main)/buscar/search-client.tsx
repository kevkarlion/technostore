"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PremiumProductCardV2 } from "@/components/product-card/premium-product-card-v2";
import type { Product } from "@/types/domain";

interface SearchClientProps {
  initialProducts: Product[];
  initialQuery: string;
  initialTotal?: number;
  initialPage?: number;
}

export function SearchClient({
  initialProducts,
  initialQuery,
  initialTotal = 0,
  initialPage = 1
}: SearchClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const limit = 20;
  const totalPages = Math.ceil(initialTotal / limit);
  const startItem = (initialPage - 1) * limit + 1;
  const endItem = Math.min(initialPage * limit, initialTotal);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    params.set("page", "1");
    router.push(`/buscar?${params.toString()}`);
  }, [query, router]);

  const goToPage = useCallback((newPage: number) => {
    const params = new URLSearchParams();
    if (initialQuery) params.set("q", initialQuery);
    params.set("page", newPage.toString());
    router.push(`/buscar?${params.toString()}`);
  }, [router, initialQuery]);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header estático - no recarga */}
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

      {/* Resultados */}
      <section className="space-y-6">
        <p className="text-sm text-[var(--foreground-muted)]">
          {initialQuery
            ? `Mostrando ${startItem}-${endItem} de ${initialTotal} resultados para "${initialQuery}"`
            : `Mostrando ${startItem}-${endItem} de ${initialTotal} productos`
          }
        </p>

        {initialProducts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-[var(--foreground-muted)]" />
            </div>
            <p className="text-[var(--foreground-muted)]">
              {initialQuery
                ? `No encontramos productos para "${initialQuery}". Probá con otro término.`
                : "No hay productos disponibles."
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {initialProducts.map((product, index) => (
                <PremiumProductCardV2 key={product.id} product={product} index={index} />
              ))}
            </div>

            {/* Paginación */}
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
