"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Edit2,
  Save,
  X,
  Plus,
  Image as ImageIcon,
  Package,
  AlertTriangle,
  RefreshCw,
  Power,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import ProductFormModal from "../ProductFormModal";

interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  profitMargin?: number;
  stock: number;
  inStock: boolean;
  category: string;
  status: string;
  imageUrl?: string;
}

interface FetchResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 15;

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "discontinued">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct, setEditProduct] = useState<{
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    stock: number;
    inStock: boolean;
    status: string;
    categories: string[];
    imageUrls: string[];
    costPrice?: number;
    profitMargin?: number;
  } | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Product | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async (search: string, page: number, status: string) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {
        // Already aborted, ignore
      }
    }
    abortRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("page", String(page));
      if (status === "all") {
        params.set("allStatuses", "true");
      } else if (status && (status === "active" || status === "discontinued" || status === "draft" || status === "inactive")) {
        params.set("status", status);
      }
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/products?${params.toString()}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("[AdminProducts] API error:", res.status, text);
        throw new Error(`Error al cargar productos (${res.status})`);
      }
      const data: FetchResponse = await res.json();

      const mapped: Product[] = (data.items || []).map((p: any) => ({
        id: p.id || p._id,
        name: p.name || "Sin nombre",
        price: p.price ?? 0,
        stock: p.stock ?? p.stockQuantity ?? 0,
        inStock: p.inStock ?? false,
        category: p.categories?.[0] || "Sin categoría",
        status: p.status || "active",
        imageUrl: p.images?.[0]?.src || p.imageUrls?.[0] || p.cloudinaryUrls?.[0],
      }));

      setProducts(mapped);
      setTotalItems(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      // Ignore abort errors - they're expected when cancelling requests
      if (err instanceof Error && err.name === 'AbortError') {
        console.log("[AdminProducts] Request cancelled");
        return;
      }
      console.error("[AdminProducts] Error:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar productos"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce del input de búsqueda
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 350);
  };

  // Fetch cuando cambia searchQuery, currentPage o statusFilter
  useEffect(() => {
    fetchProducts(searchQuery, currentPage, statusFilter);
  }, [searchQuery, currentPage, statusFilter, fetchProducts]);

  // Cleanup del debounce y abort controller
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // Mark abort controller as done - don't actually abort on unmount
      // to avoid "signal is aborted without reason" error
      abortRef.current = null;
    };
  }, []);

  const handleStockSave = async (productId: string, newStock: number) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: newStock,
          inStock: newStock > 0,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar stock");

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, stock: newStock, inStock: newStock > 0 }
            : p
        )
      );

      setEditingStock(null);
      toast.success("Stock actualizado");
    } catch (err) {
      console.error("[AdminProducts] Stock update error:", err);
      toast.error("Error al actualizar stock");
    }
  };

  const handleToggleStatus = async (product: Product) => {
    setToggleLoading(product.id);
    const newStatus = product.status === "active" ? "discontinued" : "active";
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar producto");

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, status: newStatus } : p
        )
      );

      toast.success(
        newStatus === "discontinued"
          ? "Producto dado de baja"
          : "Producto reactivado"
      );
    } catch (err) {
      console.error("[AdminProducts] Toggle status error:", err);
      toast.error("Error al actualizar producto");
    } finally {
      setToggleLoading(null);
      setPendingToggle(null);
    }
  };

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-800/50 bg-rose-950/20 py-16">
          <AlertTriangle className="h-12 w-12 text-rose-400" />
          <p className="mt-4 text-sm text-rose-400">{error}</p>
          <Button onClick={() => fetchProducts(searchQuery, currentPage, statusFilter)} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Productos
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {loading
              ? "Cargando..."
              : searchQuery
              ? `${totalItems} resultados para "${searchQuery}"`
              : `${totalItems} productos`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <div className="relative order-2 w-full sm:order-1 sm:w-auto sm:min-w-[200px] lg:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <Input
              placeholder="Buscar productos..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <div className="order-1 flex gap-2 sm:order-2">
            <Button onClick={() => { setEditProduct(null); setShowProductForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Nuevo</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchProducts(searchQuery, currentPage, statusFilter)}
              disabled={loading}
              className="px-3 sm:px-4"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="ml-1.5 hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-1 w-fit">
        {(["all", "active", "discontinued"] as const).map((value) => (
          <button
            key={value}
            onClick={() => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
              statusFilter === value
                ? "bg-[var(--accent)] text-zinc-900 shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {value === "all"
              ? "Todos"
              : value === "active"
              ? "Activos"
              : "Descontinuados"}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Package className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {totalItems}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {statusFilter === "all"
                  ? "Total productos"
                  : statusFilter === "active"
                  ? "Productos activos"
                  : "Productos descontinuados"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {lowStockCount}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Stock bajo (&lt;10)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-500/10 p-2">
              <X className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {outOfStockCount}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Sin stock
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table - Desktop */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Producto
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Categoría
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Precio
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Margen
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Stock
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--foreground-muted)] min-w-[160px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--foreground-muted)]">
                  Cargando productos...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--foreground-muted)]">
                  {searchQuery
                    ? `No se encontraron productos para "${searchQuery}"`
                    : "No hay productos cargados. Corré el scraper primero."}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-slate-900/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-800 shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-[var(--foreground-muted)]" />
                        )}
                      </div>
                      <span className="max-w-xs truncate text-sm font-medium text-[var(--foreground)]">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-sm text-[var(--foreground-muted)]">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      ${product.price.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {product.profitMargin != null ? (
                      <Badge
                        tone={
                          product.profitMargin > 30
                            ? "success"
                            : product.profitMargin >= 15
                            ? "warning"
                            : "danger"
                        }
                      >
                        {product.profitMargin.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-sm text-[var(--foreground-muted)]">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingStock === product.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={stockValue}
                          onChange={(e) =>
                            setStockValue(parseInt(e.target.value) || 0)
                          }
                          className="h-8 w-20 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleStockSave(product.id, stockValue);
                            if (e.key === "Escape") setEditingStock(null);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleStockSave(product.id, stockValue)
                          }
                          className="h-8 w-8 p-0 text-emerald-400"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingStock(null)}
                          className="h-8 w-8 p-0 text-rose-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingStock(product.id);
                          setStockValue(product.stock);
                        }}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium transition hover:bg-slate-800 ${
                          product.stock === 0
                            ? "text-rose-400"
                            : product.stock < 10
                            ? "text-amber-400"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        <span>{product.stock}</span>
                        <Edit2 className="h-3 w-3 lg:opacity-0 lg:group-hover:opacity-100" />
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      tone={
                        product.status === "active"
                          ? "success"
                          : product.status === "discontinued"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {product.status === "active"
                        ? "Activo"
                        : product.status === "discontinued"
                        ? "Descontinuado"
                        : product.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={toggleLoading === product.id}
                        onClick={() => setPendingToggle(product)}
                        title={
                          product.status === "active"
                            ? "Dar de baja"
                            : "Reactivar"
                        }
                      >
                        <Power
                          className={`h-4 w-4 ${
                            product.status === "active"
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loadingEdit}
                        onClick={async () => {
                          setLoadingEdit(true);
                          try {
                            const res = await fetch(`/api/products/${product.id}`);
                            if (!res.ok) throw new Error("Error al cargar producto");
                            const data = await res.json();
                            setEditProduct({
                              id: data.id || data._id,
                              name: data.name,
                              description: data.description,
                              price: data.price,
                              currency: data.currency || "USD",
                              stock: data.stock ?? 0,
                              inStock: data.inStock ?? false,
                              status: data.status || "active",
                              categories: data.categories || [],
                              imageUrls: data.imageUrls || [],
                              costPrice: data.costPrice,
                              profitMargin: data.profitMargin,
                            });
                            setShowProductForm(true);
                          } catch (err) {
                            console.error("[AdminProducts] Error fetching product:", err);
                            toast.error("Error al cargar producto para editar");
                          } finally {
                            setLoadingEdit(false);
                          }
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Products Cards - Mobile */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 py-12 text-center text-sm text-[var(--foreground-muted)]">
            Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 py-12 text-center text-sm text-[var(--foreground-muted)]">
            {searchQuery
              ? `No se encontraron productos para "${searchQuery}"`
              : "No hay productos cargados. Corré el scraper primero."}
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:bg-slate-900/30"
            >
              {/* Top row: image + name + actions */}
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-[var(--foreground-muted)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    {product.category}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-9 w-9 p-0"
                  disabled={toggleLoading === product.id}
                  onClick={() => setPendingToggle(product)}
                  title={
                    product.status === "active"
                      ? "Dar de baja"
                      : "Reactivar"
                  }
                >
                  <Power
                    className={`h-4 w-4 ${
                      product.status === "active"
                        ? "text-rose-400"
                        : "text-emerald-400"
                    }`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-9 w-9 p-0"
                  disabled={loadingEdit}
                  onClick={async () => {
                    setLoadingEdit(true);
                    try {
                      const res = await fetch(`/api/products/${product.id}`);
                      if (!res.ok) throw new Error("Error al cargar producto");
                      const data = await res.json();
                      setEditProduct({
                        id: data.id || data._id,
                        name: data.name,
                        description: data.description,
                        price: data.price,
                        currency: data.currency || "USD",
                        stock: data.stock ?? 0,
                        inStock: data.inStock ?? false,
                        status: data.status || "active",
                        categories: data.categories || [],
                        imageUrls: data.imageUrls || [],
                        costPrice: data.costPrice,
                        profitMargin: data.profitMargin,
                      });
                      setShowProductForm(true);
                    } catch (err) {
                      console.error("[AdminProducts] Error fetching product:", err);
                      toast.error("Error al cargar producto para editar");
                    } finally {
                      setLoadingEdit(false);
                    }
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Info grid: price, margin, stock, status */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-slate-900/50 p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                    Precio
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                    Margen
                  </p>
                  <div className="mt-1">
                    {product.profitMargin != null ? (
                      <Badge
                        tone={
                          product.profitMargin > 30
                            ? "success"
                            : product.profitMargin >= 15
                            ? "warning"
                            : "danger"
                        }
                      >
                        {product.profitMargin.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-sm text-[var(--foreground-muted)]">
                        —
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                    Stock
                  </p>
                  {editingStock === product.id ? (
                    <div className="mt-1 flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        value={stockValue}
                        onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
                        className="h-8 w-full text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleStockSave(product.id, stockValue);
                          if (e.key === "Escape") setEditingStock(null);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStockSave(product.id, stockValue)}
                        className="h-8 w-8 p-0 text-emerald-400 shrink-0"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingStock(null)}
                        className="h-8 w-8 p-0 text-rose-400 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingStock(product.id);
                        setStockValue(product.stock);
                      }}
                      className={`mt-0.5 flex items-center gap-1 text-sm font-semibold ${
                        product.stock === 0
                          ? "text-rose-400"
                          : product.stock < 10
                          ? "text-amber-400"
                          : "text-[var(--foreground)]"
                      }`}
                    >
                      {product.stock}
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="rounded-lg bg-slate-900/50 p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                    Estado
                  </p>
                  <div className="mt-1">
                    <Badge
                      tone={
                        product.status === "active"
                          ? "success"
                          : product.status === "discontinued"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {product.status === "active"
                        ? "Activo"
                        : product.status === "discontinued"
                        ? "Descontinuado"
                        : product.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-center text-sm text-[var(--foreground-muted)] sm:text-left">
            Página {currentPage} de {totalPages}
            <span className="hidden sm:inline"> · {totalItems} productos</span>
          </span>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

      <ProductFormModal
        open={showProductForm}
        onClose={() => { setShowProductForm(false); setEditProduct(null); }}
        onSuccess={() => fetchProducts(searchQuery, 1)}
        editProduct={editProduct}
      />

      {/* Confirm toggle status modal */}
      <ConfirmModal
        open={!!pendingToggle}
        title={
          pendingToggle?.status === "active"
            ? "Dar de baja producto"
            : "Reactivar producto"
        }
        message={
          pendingToggle
            ? `¿Estás seguro de ${
                pendingToggle.status === "active"
                  ? "dar de baja"
                  : "reactivar"
              } "${pendingToggle.name}"?`
            : ""
        }
        confirmLabel={
          pendingToggle?.status === "active"
            ? "Dar de baja"
            : "Reactivar"
        }
        variant={pendingToggle?.status === "active" ? "danger" : "default"}
        onConfirm={() => {
          if (pendingToggle) handleToggleStatus(pendingToggle);
        }}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}
