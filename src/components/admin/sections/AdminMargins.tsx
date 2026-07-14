"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Layers,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_GROUPS } from "./category-groups";
import { cleanProductName } from "@/domain/mappers/product-to-presentation";

interface MarginProduct {
  id: string;
  name: string;
  costPrice?: number;
  price?: number;
  profitMargin?: number;
  category: string;
}

interface MarginCategory {
  slug: string;
  name: string;
  productCount: number;
  defaultProfitMargin: number | null;
}

function getMarginBadgeTone(margin: number): "success" | "warning" | "danger" {
  if (margin > 30) return "success";
  if (margin >= 15) return "warning";
  return "danger";
}

function getMarginLabel(margin: number): string {
  if (margin > 30) return "Alto";
  if (margin >= 15) return "Medio";
  return "Bajo";
}

/* ── Skeletons para mantener altura durante carga ─────────── */
function SkeletonTableRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={`skel-${i}`} className="animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 w-48 rounded bg-slate-800/60" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 rounded bg-slate-800/60" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 rounded bg-slate-800/60" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 rounded bg-slate-800/60" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 rounded bg-slate-800/60" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-20 rounded-full bg-slate-800/60" />
          </td>
          <td className="px-4 py-3">
            <div className="ml-auto h-4 w-24 rounded bg-slate-800/60" />
          </td>
        </tr>
      ))}
    </>
  );
}

function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skel-card-${i}`}
          className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-800/60" />
              <div className="h-3 w-1/3 rounded bg-slate-800/60" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-slate-800/60" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="rounded-lg bg-slate-900/50 p-2.5">
                <div className="h-3 w-10 rounded bg-slate-800/60" />
                <div className="mt-1.5 h-4 w-14 rounded bg-slate-800/60" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function SkeletonCategoryRows({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={`skel-cat-${i}`} className="animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 w-40 rounded bg-slate-800/60" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-12 rounded bg-slate-800/60" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-16 rounded-full bg-slate-800/60" />
          </td>
          <td className="px-4 py-3">
            <div className="ml-auto h-4 w-16 rounded bg-slate-800/60" />
          </td>
        </tr>
      ))}
    </>
  );
}

function SkeletonCategoryCards({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skel-cat-card-${i}`}
          className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/50 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-800/60" />
              <div className="h-3 w-1/4 rounded bg-slate-800/60" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-16 rounded-full bg-slate-800/60" />
              <div className="h-8 w-16 rounded-lg bg-slate-800/60" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function AdminMargins() {
  const [products, setProducts] = useState<MarginProduct[]>([]);
  const [categories, setCategories] = useState<MarginCategory[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marginValue, setMarginValue] = useState<number>(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [marginModalProduct, setMarginModalProduct] = useState<MarginProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>(CATEGORY_GROUPS[0]?.slug ?? "");
  const hasAutoSelected = useRef(false);

  const [bulkCategory, setBulkCategory] = useState<MarginCategory | null>(null);
  const [bulkMarginValue, setBulkMarginValue] = useState<number>(0);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const fetchMargins = useCallback(async () => {
    setError(null);
    setProductsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      const url = `/api/margins${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar márgenes");
      const data = await res.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error("[AdminMargins] Error:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar márgenes"
      );
    } finally {
      setProductsLoading(false);
    }
  }, [selectedCategory]);

  // Initial mount: fetch & auto-select first category (once)
  useEffect(() => {
    if (hasAutoSelected.current) return;
    hasAutoSelected.current = true;

    (async () => {
      setError(null);
      try {
        const res = await fetch("/api/margins");
        if (!res.ok) throw new Error("Error al cargar márgenes");
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setCategoriesLoading(false);
          setSelectedCategory(data.categories[0].slug);
        } else {
          setProductsLoading(false);
          setCategoriesLoading(false);
        }
      } catch (err) {
        console.error("[AdminMargins] Init error:", err);
        setError(
          err instanceof Error ? err.message : "Error al cargar márgenes"
        );
        setProductsLoading(false);
        setCategoriesLoading(false);
      }
    })();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products when selectedCategory changes (auto-select or user)
  useEffect(() => {
    if (hasAutoSelected.current || selectedCategory) {
      fetchMargins();
    }
  }, [fetchMargins, selectedCategory]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    if (!selectedGroup) return sortedCategories;
    const group = CATEGORY_GROUPS.find((g) => g.slug === selectedGroup);
    if (!group) return sortedCategories;
    return sortedCategories.filter((c) => group.children.includes(c.slug));
  }, [sortedCategories, selectedGroup]);

  const handleMarginSave = async (productId: string) => {
    setSavingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profitMargin: marginValue }),
      });

      if (!res.ok) throw new Error("Error al actualizar margen");

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                profitMargin: marginValue,
                price: Math.round(p.costPrice * (1 + marginValue / 100) * 100) / 100,
              }
            : p
        )
      );

      setMarginModalProduct(null);
      toast.success("Margen actualizado");
    } catch (err) {
      console.error("[AdminMargins] Save error:", err);
      toast.error("Error al actualizar margen");
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkOpen = (cat: MarginCategory) => {
    setBulkCategory(cat);
    setBulkMarginValue(cat.defaultProfitMargin ?? 0);
    setBulkResult(null);
  };

  const handleBulkApply = async () => {
    if (!bulkCategory) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/margins/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug: bulkCategory.slug,
          profitMargin: bulkMarginValue,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al aplicar margen");
      }

      const data = await res.json();
      setBulkResult(`${data.updatedProducts} productos actualizados`);
      toast.success(`Margen aplicado a ${data.updatedProducts} productos`);
      setBulkCategory(null);
      fetchMargins();
    } catch (err) {
      console.error("[AdminMargins] Bulk error:", err);
      toast.error(
        err instanceof Error ? err.message : "Error al aplicar margen"
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const highMarginCount = products.filter(
    (p) => (p.profitMargin ?? 0) > 30
  ).length;
  const mediumMarginCount = products.filter(
    (p) => (p.profitMargin ?? 0) >= 15 && (p.profitMargin ?? 0) <= 30
  ).length;
  const lowMarginCount = products.filter(
    (p) => (p.profitMargin ?? 0) < 15
  ).length;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-800/50 bg-rose-950/20 py-16">
          <AlertTriangle className="h-12 w-12 text-rose-400" />
          <p className="mt-4 text-sm text-rose-400">{error}</p>
          <Button onClick={() => { setLoading(true); fetchMargins(); }} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Márgenes de Ganancia
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {productsLoading || categoriesLoading
              ? "Cargando..."
              : `${products.length} productos`}
          </p>
        </div>
        <Button variant="outline" onClick={() => { setProductsLoading(true); fetchMargins(); }} disabled={productsLoading}>
          <RefreshCw
            className={`mr-1.5 h-4 w-4 ${productsLoading ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {highMarginCount}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Margen alto (&gt;30%)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {mediumMarginCount}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Margen medio (15-30%)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-500/10 p-2">
              <DollarSign className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {lowMarginCount}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Margen bajo (&lt;15%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Margins por Categoría ────────────────────────────── */}
      <div className="overflow-hidden">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Márgenes por Categoría
            </h2>
          </div>

          <div className="relative min-w-0 sm:w-auto">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full min-w-0 appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-8 text-sm text-[var(--foreground)] transition focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">Todos los grupos</option>
              {CATEGORY_GROUPS.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          </div>
        </div>

        {/* Categories Table - Desktop */}
        <div
          className="hidden lg:block rounded-xl border border-slate-800 bg-slate-950/50 overflow-auto"
          style={{ height: '300px', overflowAnchor: 'none' }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Categoría
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Productos
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Margen Default (%)
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-right text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {categoriesLoading ? (
                <SkeletonCategoryRows />
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-[var(--foreground-muted)]"
                  >
                    {selectedGroup && categories.length > 0
                      ? "No hay categorías en este grupo"
                      : "No hay categorías con productos"}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr
                    key={cat.slug}
                    className="transition-colors hover:bg-slate-900/30"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {cat.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {cat.productCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {cat.defaultProfitMargin != null ? (
                        <Badge tone={getMarginBadgeTone(cat.defaultProfitMargin)}>
                          {cat.defaultProfitMargin.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-sm text-[var(--foreground-muted)]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBulkOpen(cat)}
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Categories Cards - Mobile */}
        <div className="space-y-3 lg:hidden">
          {categoriesLoading ? (
            <SkeletonCategoryCards />
          ) : filteredCategories.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 py-12 text-center text-sm text-[var(--foreground-muted)]">
              {selectedGroup && categories.length > 0
                ? "No hay categorías en este grupo"
                : "No hay categorías con productos"}
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div
                key={cat.slug}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:bg-slate-900/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {cat.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    {cat.productCount} producto{cat.productCount !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {cat.defaultProfitMargin != null ? (
                    <Badge tone={getMarginBadgeTone(cat.defaultProfitMargin)}>
                      {cat.defaultProfitMargin.toFixed(1)}%
                    </Badge>
                  ) : (
                    <span className="text-sm text-[var(--foreground-muted)]">—</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkOpen(cat)}
                    className="shrink-0"
                  >
                    Editar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── SECTION 2: Productos ────────────────────────────────────────── */}
      <div className="space-y-3 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <DollarSign className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Productos
            </h2>
          </div>

          <div className="relative min-w-0">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setProductsLoading(true);
                }}
                className="w-full min-w-0 appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-8 text-sm text-[var(--foreground)] transition focus:border-[var(--accent)] focus:outline-none"
              >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name} ({cat.productCount})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          </div>
        </div>

        {/* Margins Table - Desktop */}
        <div
          className="hidden lg:block rounded-xl border border-slate-800 bg-slate-950/50 overflow-y-auto"
          style={{ height: '520px', overflowAnchor: 'none' }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Producto
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Categoría
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Costo
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Precio
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Ganancia
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Margen
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-right text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {productsLoading ? (
                <SkeletonTableRows />
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-[var(--foreground-muted)]"
                  >
                    No hay productos en esta categoría.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-slate-900/30"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {cleanProductName(product.name)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {product.category || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--foreground)]">
                        {product.costPrice != null ? `$${product.costPrice.toFixed(2)}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {product.price != null ? `$${product.price.toFixed(2)}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {product.price != null && product.costPrice != null
                          ? `$${(product.price - product.costPrice).toFixed(2)}`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.profitMargin != null ? (
                        <Badge tone={getMarginBadgeTone(product.profitMargin)}>
                          {product.profitMargin.toFixed(1)}% ·{" "}
                          {getMarginLabel(product.profitMargin)}
                        </Badge>
                      ) : (
                        <span className="text-sm text-[var(--foreground-muted)]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={savingId === product.id}
                          onClick={() => {
                            setMarginModalProduct(product);
                            setMarginValue(product.profitMargin ?? 0);
                          }}
                        >
                          {savingId === product.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            "Editar margen"
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Margins Cards - Mobile */}
        <div className="space-y-3 lg:hidden">
          {productsLoading ? (
            <SkeletonCards />
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 py-12 text-center text-sm text-[var(--foreground-muted)]">
              No hay productos en esta categoría.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:bg-slate-900/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2">
                      {cleanProductName(product.name)}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                      {product.category || "—"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={savingId === product.id}
                    onClick={() => {
                      setMarginModalProduct(product);
                      setMarginValue(product.profitMargin ?? 0);
                    }}
                    className="shrink-0"
                  >
                    {savingId === product.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Editar"
                    )}
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  <div className="rounded-lg bg-slate-900/50 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                      Costo
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                      {product.costPrice != null ? `$${product.costPrice.toFixed(2)}` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                      Precio
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                      {product.price != null ? `$${product.price.toFixed(2)}` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                      Ganancia
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                      {product.price != null && product.costPrice != null
                        ? `$${(product.price - product.costPrice).toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                      Margen
                    </p>
                    {product.profitMargin != null ? (
                      <div className="mt-1">
                        <Badge tone={getMarginBadgeTone(product.profitMargin)}>
                          {product.profitMargin.toFixed(1)}%
                        </Badge>
                      </div>
                    ) : (
                      <span className="mt-1 block text-sm text-[var(--foreground-muted)]">
                        —
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Individual Margin Edit Modal ──────────────────────────── */}
      <AnimatePresence>
        {marginModalProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !savingId && setMarginModalProduct(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/40"
            >
              <button
                onClick={() => !savingId && setMarginModalProduct(null)}
                disabled={!!savingId}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--foreground-muted)] transition hover:bg-slate-800 hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                <DollarSign className="h-6 w-6" />
              </div>

              <h3 className="text-center text-lg font-semibold text-[var(--foreground)]">
                Editar margen
              </h3>

              <p className="mt-1 text-center text-sm text-[var(--foreground-muted)] line-clamp-2">
                {cleanProductName(marginModalProduct.name)}
              </p>

              <div className="mt-6 space-y-5">
                {/* Current values */}
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-900/50 p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                      Costo actual
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                      {marginModalProduct.costPrice != null
                        ? `$${marginModalProduct.costPrice.toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                      Precio actual
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                      {marginModalProduct.price != null
                        ? `$${marginModalProduct.price.toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Margin input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    Nuevo margen de ganancia (%)
                  </label>
                  <Input
                    type="number"
                    step={0.1}
                    value={marginValue}
                    onChange={(e) =>
                      setMarginValue(parseFloat(e.target.value) || 0)
                    }
                    className="h-14 text-2xl font-semibold text-center"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleMarginSave(marginModalProduct.id);
                      if (e.key === "Escape") setMarginModalProduct(null);
                    }}
                  />
                </div>

                {/* Price preview */}
                {marginModalProduct.costPrice != null ? (
                  <div className="rounded-xl border border-emerald-800/30 bg-emerald-500/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Nuevo precio estimado
                      </p>
                      <p className="text-xl font-bold text-emerald-400">
                        ${(marginModalProduct.costPrice * (1 + marginValue / 100)).toFixed(2)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                      {marginModalProduct.costPrice.toFixed(2)} × {marginValue}% de margen
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-800/30 bg-amber-500/5 p-4">
                    <p className="text-sm text-amber-400">
                      Sin precio de costo
                    </p>
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                      Configurá el costo primero para calcular el precio
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <button
                    onClick={() => setMarginModalProduct(null)}
                    disabled={!!savingId}
                    className="order-2 w-full rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-slate-800 disabled:opacity-50 sm:order-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleMarginSave(marginModalProduct.id)}
                    disabled={savingId === marginModalProduct.id}
                    className="order-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 sm:order-2"
                  >
                    {savingId === marginModalProduct.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar margen"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Bulk Edit Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {bulkCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !bulkLoading && setBulkCategory(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/40 sm:p-6"
            >
              <button
                onClick={() => !bulkLoading && setBulkCategory(null)}
                disabled={bulkLoading}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--foreground-muted)] transition hover:bg-slate-800 hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                <Layers className="h-6 w-6" />
              </div>

              <h3 className="text-center text-lg font-semibold text-[var(--foreground)]">
                Margen por Categoría
              </h3>

              <p className="mt-1 text-center text-sm text-[var(--foreground-muted)]">
                {bulkCategory.name} · {bulkCategory.productCount} productos
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                    Nuevo margen de ganancia (%)
                  </label>
                  <Input
                    type="number"
                    step={0.1}
                    value={bulkMarginValue}
                    onChange={(e) =>
                      setBulkMarginValue(parseFloat(e.target.value) || 0)
                    }
                    disabled={bulkLoading}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleBulkApply();
                      if (e.key === "Escape" && !bulkLoading)
                        setBulkCategory(null);
                    }}
                  />
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                    Se actualizarán los {bulkCategory.productCount} productos de
                    esta categoría que tengan precio de costo
                  </p>
                </div>

                {bulkResult && (
                  <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-400">
                    {bulkResult}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <button
                    onClick={() => setBulkCategory(null)}
                    disabled={bulkLoading}
                    className="order-2 w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-slate-800 disabled:opacity-50 sm:order-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleBulkApply}
                    disabled={bulkLoading}
                    className="order-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 sm:order-2"
                  >
                    {bulkLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      "Aplicar a todos los productos"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
