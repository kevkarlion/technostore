"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PremiumProductCardV2 } from "@/components/product-card/premium-product-card-v2";
import { ProductFilters } from "@/components/category/product-filters";
import { ActiveFilters } from "@/components/category/active-filters";
import { FilterButton } from "@/components/category/filter-button";
import { SlidersHorizontal, LayoutGrid, List, ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";
import type { Category } from "@/types/domain";
import type { Product } from "@/types/domain";

interface CategoryProductsClientProps {
  category: Category;
  products: Product[];
  result: {
    total: number;
    page: number;
    totalPages: number;
  };
  currentPage: number;
  baseUrl: string;
  categorySlug: string;
  priceRange: { min: number; max: number };
  brands: { brand: string; count: number }[];
  filters: {
    priceMin: number;
    priceMax: number;
    brands: string[];
  };
}

export function CategoryProductsClient({
  category,
  products,
  result,
  currentPage,
  baseUrl,
  categorySlug,
  priceRange,
  brands,
  filters,
}: CategoryProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Build pagination URL helper (runs on client)
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNum.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  // Local state for filters (synced with URL)
  const [priceMin, setPriceMin] = useState(filters.priceMin);
  const [priceMax, setPriceMax] = useState(filters.priceMax);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(filters.brands);

  const hasFilters = priceMin > priceRange.min || 
                     priceMax < priceRange.max || 
                     selectedBrands.length > 0;

  const activeFiltersCount = 
    (priceMin > priceRange.min ? 1 : 0) +
    (priceMax < priceRange.max ? 1 : 0) +
    (selectedBrands.length > 0 ? 1 : 0);

  // URL update functions
  const updateUrl = (newFilters: { priceMin?: number; priceMax?: number; brands?: string[] }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    const newPriceMin = newFilters.priceMin ?? priceMin;
    const newPriceMax = newFilters.priceMax ?? priceMax;
    const newBrands = newFilters.brands ?? selectedBrands;

    if (newPriceMin > priceRange.min) {
      params.set("priceMin", newPriceMin.toString());
    } else {
      params.delete("priceMin");
    }

    if (newPriceMax < priceRange.max) {
      params.set("priceMax", newPriceMax.toString());
    } else {
      params.delete("priceMax");
    }

    if (newBrands.length > 0) {
      params.set("brands", newBrands.join(","));
    } else {
      params.delete("brands");
    }

    params.delete("page");
    router.push(`${baseUrl}?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    setPriceMin(priceRange.min);
    setPriceMax(priceRange.max);
    setSelectedBrands([]);
    router.push(baseUrl, { scroll: false });
  };

  const toggleBrand = (brand: string) => {
    const newBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(newBrands);
    updateUrl({ brands: newBrands });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-xl text-xs text-[var(--foreground-muted)]">
            {category.description}
          </p>
        )}
      </header>

      {/* Active Filters */}
      <div className="lg:hidden">
        <ActiveFilters
          priceMin={priceMin}
          priceMax={priceMax}
          selectedBrands={selectedBrands}
          defaultPriceMin={priceRange.min}
          defaultPriceMax={priceRange.max}
          onPriceMinChange={(v) => {
            setPriceMin(v);
            updateUrl({ priceMin: v });
          }}
          onPriceMaxChange={(v) => {
            setPriceMax(v);
            updateUrl({ priceMax: v });
          }}
          onBrandToggle={toggleBrand}
          onClearAll={clearAllFilters}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-[var(--foreground-muted)]">
          Mostrando {products.length} de {result.total} productos
        </span>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle (Desktop) */}
          <div className="hidden items-center gap-1 rounded-lg border border-[var(--border-subtle)] lg:flex">
            <button
              onClick={() => setViewMode("grid")}
              className={clsx(
                "p-2 transition-colors",
                viewMode === "grid" 
                  ? "bg-[var(--accent)] text-[var(--background)]" 
                  : "text-[var(--foreground-muted)] hover:bg-[var(--background)]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={clsx(
                "p-2 transition-colors",
                viewMode === "list" 
                  ? "bg-[var(--accent)] text-[var(--background)]" 
                  : "text-[var(--foreground-muted)] hover:bg-[var(--background)]"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout: Sidebar + Grid */}
      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden w-64 shrink-0 space-y-6 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
              <SlidersHorizontal className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">
                Filtros
              </h2>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                Precio
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--foreground)]">
                    ${priceMin.toLocaleString("es-AR")}
                  </span>
                  <span className="text-[var(--foreground)]">
                    ${priceMax.toLocaleString("es-AR")}
                  </span>
                </div>
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={priceMin}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val < priceMax) {
                      setPriceMin(val);
                    }
                  }}
                  onPointerUp={() => updateUrl({ priceMin })}
                  className="w-full cursor-pointer accent-[var(--accent)]"
                />
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={priceMax}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val > priceMin) {
                      setPriceMax(val);
                    }
                  }}
                  onPointerUp={() => updateUrl({ priceMax })}
                  className="w-full cursor-pointer accent-[var(--accent)]"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                Marca
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {brands.map((item) => (
                  <label
                    key={item.brand}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[var(--background)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(item.brand)}
                      onChange={() => toggleBrand(item.brand)}
                      className="h-4 w-4 rounded border-[var(--border-subtle)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="flex-1 text-sm text-[var(--foreground)]">{item.brand}</span>
                    <span className="text-xs text-[var(--foreground-muted)]">({item.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearAllFilters}
                className="w-full rounded-lg border border-[var(--border-subtle)] py-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--foreground-muted)]">
                No se encontraron productos con los filtros aplicados.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className={clsx(
                "grid gap-4",
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  : "grid-cols-1"
              )}>
                {products.map((product, index) => (
                  <PremiumProductCardV2 key={product.id} product={product} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {result.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 py-8">
                  {currentPage > 1 && (
                    <Link
                      href={buildPageUrl(currentPage - 1)}
                      className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                    >
                      ← Anterior
                    </Link>
                  )}
                  
                  {Array.from({ length: result.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const diff = Math.abs(page - currentPage);
                      return diff === 0 || diff === 1 || (page === 1 || page === result.totalPages);
                    })
                    .map((page, idx, arr) => {
                      if (idx > 0 && arr[idx - 1] !== page - 1) {
                        return <span key={`ellipsis-${page}`} className="px-2 text-[var(--foreground-muted)]">...</span>;
                      }
                      return (
                        <Link
                          key={page}
                          href={buildPageUrl(page)}
                          className={clsx(
                            "rounded-md px-3 py-1.5 text-sm",
                            page === currentPage
                              ? "bg-[var(--accent)] text-white"
                              : "border border-[var(--border-subtle)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                          )}
                        >
                          {page}
                        </Link>
                      );
                    })}
                  
                  {currentPage < result.totalPages && (
                    <Link
                      href={buildPageUrl(currentPage + 1)}
                      className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                    >
                      Siguiente →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Button */}
      <FilterButton 
        onClick={() => setIsFiltersOpen(true)} 
        activeCount={activeFiltersCount}
      />

      {/* Mobile Filter Drawer */}
      <ProductFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        brands={brands}
        priceRange={priceRange}
        selectedPriceMin={priceMin}
        selectedPriceMax={priceMax}
        selectedBrands={selectedBrands}
        onPriceMinChange={(v) => {
          setPriceMin(v);
          // Don't update URL until user closes
        }}
        onPriceMaxChange={(v) => {
          setPriceMax(v);
          // Don't update URL until user closes
        }}
        onBrandToggle={toggleBrand}
        onClearFilters={() => {
          setPriceMin(priceRange.min);
          setPriceMax(priceRange.max);
          setSelectedBrands([]);
        }}
        hasFilters={hasFilters}
      />
    </div>
  );
}