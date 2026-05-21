"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PremiumProductCardV2 } from "@/components/product-card/premium-product-card-v2";
import type { Product } from "@/types/domain";
import { Skeleton } from "@/components/ui/skeleton";

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
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(20);

  // Sync con URL params - solo cuando cambia la URL, no cuando el usuario tipea
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const p = parseInt(searchParams.get("page") || "1", 10);
    setQuery(q);
    setPage(p);
  }, [searchParams]);

  // Buscar cuando cambia la URL
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const q = searchParams.get("q");
        const p = parseInt(searchParams.get("page") || "1", 10);
        const url = q 
          ? `/api/products?q=${encodeURIComponent(q)}&page=${p}&limit=${limit}` 
          : `/api/products?featured=true&limit=${limit}`;
        const response = await fetch(url);
        const data = await response.json();
        setProducts(data.products || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, limit]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/buscar?${params.toString()}`);
  }, [query, router, searchParams]);

  const goToPage = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/buscar?${params.toString()}`);
  }, [router, searchParams]);

  const currentQuery = searchParams.get("q") || "";
  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

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

      {/* Resultados - actualiza sin recargar página */}
      <section className="space-y-6">
        <p className="text-sm text-[var(--foreground-muted)]">
          {currentQuery
            ? `Mostrando ${startItem}-${endItem} de ${total} resultados para "${currentQuery}"`
            : `Mostrando ${startItem}-${endItem} de ${total} productos`
          }
        </p>

        {isLoading ? (
          // Skeleton solo en las cards
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-[var(--foreground-muted)]" />
            </div>
            <p className="text-[var(--foreground-muted)]">
              {currentQuery
                ? `No encontramos productos para "${currentQuery}". Probá con otro término.`
                : "No hay productos disponibles."
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <PremiumProductCardV2 key={product.id} product={product} index={index} />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--border-subtle)] transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-[var(--foreground-muted)] px-4">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
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