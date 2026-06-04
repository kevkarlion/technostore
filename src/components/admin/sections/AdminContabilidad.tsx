"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { cleanProductName } from "@/domain/mappers/product-to-presentation";
import {
  DollarSign,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Package,
  X,
  Coins,
} from "lucide-react";
import type {
  ContabilidadResponse,
  ContabilidadOrder,
  ContabilidadItem,
} from "@/domain/dto/contabilidad.dto";

/* ── Helpers ──────────────────────────────────────────────── */

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDefaultRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/* ── Sub-components ───────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex rounded-lg bg-[var(--accent)]/10 p-2 text-[var(--accent)] shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-semibold text-[var(--foreground)] break-words leading-tight">
            {value}
          </p>
          <p className="text-[11px] sm:text-xs text-[var(--foreground-muted)] mt-0.5">
            {label}
          </p>
          {sub && (
            <p className="text-[10px] sm:text-[11px] text-[var(--foreground-muted)]/60 mt-0.5">
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalsBreakdown({ totals }: { totals: ContabilidadOrder["totals"] }) {
  return (
    <div className="mt-2 grid grid-cols-4 gap-2 rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-xs">
      <div>
        <p className="text-[10px] text-[var(--foreground-muted)]">Subtotal</p>
        <p className="font-medium text-[var(--foreground)]">
          ${totals.subtotal.toFixed(2)}
        </p>
      </div>
      <div>
        <p className="text-[10px] text-[var(--foreground-muted)]">Shipping</p>
        <p className="font-medium text-[var(--foreground)]">
          ${totals.shipping.toFixed(2)}
        </p>
      </div>
      <div>
        <p className="text-[10px] text-[var(--foreground-muted)]">IVA</p>
        <p className="font-medium text-[var(--foreground)]">
          ${totals.taxes.toFixed(2)}
        </p>
      </div>
      <div>
        <p className="text-[10px] text-[var(--foreground-muted)]">Total</p>
        <p className="font-semibold text-[var(--accent)]">
          ${totals.total.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: ContabilidadItem }) {
  const hasCost = item.costPriceUsd != null;
  const cleanName = cleanProductName(item.productName);
  return (
    <div className="rounded-lg bg-slate-900/30 px-3 py-2 text-xs">
      {/* Product name + quantity */}
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-medium text-[var(--foreground)]">
          {cleanName}
        </p>
        <p className="shrink-0 text-[var(--foreground-muted)]">
          x{item.quantity}
        </p>
      </div>
      {/* Labeled values grid - USD values */}
      <div className="mt-1.5 grid grid-cols-4 gap-2">
        <div>
          <p className="text-[10px] text-[var(--foreground-muted)]">Vendido (USD)</p>
          <p className="font-medium text-[var(--foreground)]">
            ${item.unitPriceUsd?.toFixed(2) ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--foreground-muted)]">Costo (USD)</p>
          {hasCost ? (
            <p className="font-medium text-[var(--foreground)]">
              ${item.costPriceUsd?.toFixed(2) ?? "—"}
            </p>
          ) : (
            <Badge tone="warning" className="text-[10px] px-1.5 py-0">
              Sin costo
            </Badge>
          )}
        </div>
        <div>
          <p className="text-[10px] text-[var(--foreground-muted)]">Ganancia (USD)</p>
          {hasCost ? (
            <p className="font-medium text-emerald-400">
              +${item.gainUsd?.toFixed(2) ?? "—"}
            </p>
          ) : (
            <span className="text-[var(--foreground-muted)]">—</span>
          )}
        </div>
        <div>
          <p className="text-[10px] text-[var(--foreground-muted)]">Margen</p>
          {hasCost ? (
            <p className="font-medium text-[var(--foreground)]">
              {item.marginPct?.toFixed(1)}%
            </p>
          ) : (
            <span className="text-[var(--foreground-muted)]">—</span>
          )}
        </div>
      </div>
      {/* Ganancia en ARS */}
      {hasCost && item.gain != null && (
        <div className="mt-1 pt-1 border-t border-slate-700/50">
          <p className="text-[10px] text-[var(--foreground-muted)]">
            Ganancia en pesos: <span className="text-emerald-400 font-medium">+${item.gain.toFixed(2)} ARS</span>
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */

export default function AdminContabilidad() {
  const [data, setData] = useState<ContabilidadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range
  const defaultRange = getDefaultRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(18);

  // Items detail modal
  const [modalOrder, setModalOrder] = useState<ContabilidadOrder | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/contabilidad?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? "Error al carrar contabilidad");
      }
      const json: ContabilidadResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error("[AdminContabilidad] Error:", err);
      setError(
        err instanceof Error ? err.message : "Error al carrar contabilidad"
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, limit]);

  // Auto-fetch on mount + date/page change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page to 1 when dates change, so fetchData re-runs via the effect above
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  const totals = data?.totals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Contabilidad
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {loading
              ? "Cargando..."
              : data
                ? `${data.total} orden${data.total !== 1 ? "es" : ""} en el período`
                : "Control financiero de órdenes"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setPage(1);
            fetchData();
          }}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {/* Date filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <div className="min-w-0 flex-1 sm:flex-none">
          <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">
            Desde
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-[var(--foreground)] transition focus:border-[var(--accent)] focus:outline-none sm:w-auto"
          />
        </div>
        <div className="min-w-0 flex-1 sm:flex-none">
          <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">
            Hasta
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-[var(--foreground)] transition focus:border-[var(--accent)] focus:outline-none sm:w-auto"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-800/50 bg-rose-950/20 py-12">
          <AlertTriangle className="h-10 w-10 text-rose-400" />
          <p className="mt-3 text-sm text-rose-400">{error}</p>
          <Button
            onClick={() => fetchData()}
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Summary cards */}
      {!error && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            icon={<ShoppingCart className="h-5 w-5" />}
            label="Órdenes"
            value={totals?.totalOrders.toLocaleString("es-AR") ?? "—"}
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Ingresos"
            value={
              totals ? `$${totals.totalRevenue.toLocaleString("en-US")}` : "—"
            }
          />
          <StatCard
            icon={<Coins className="h-5 w-5" />}
            label="Costos"
            value={
              totals ? `$${totals.totalCosts.toLocaleString("en-US")}` : "—"
            }
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Ganancia Neta"
            value={
              totals
                ? `$${totals.totalProfit.toLocaleString("en-US")}`
                : "—"
            }
            sub={
              totals?.avgMargin != null
                ? `Margen prom. ${totals.avgMargin.toFixed(1)}%`
                : undefined
            }
          />
          <StatCard
            icon={<Package className="h-5 w-5" />}
            label="Sin costo"
            value={
              totals
                ? `${totals.unpricedOrders} ord. · ${totals.unpricedItemCount} items`
                : "—"
            }
          />
        </div>
      )}

      {/* Orders Table - Desktop */}
      {!error && (
        <div className="hidden lg:block rounded-xl border border-slate-800 bg-slate-950/50 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Orden
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Cliente
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Items
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Total
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Ganancia
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Margen
                </th>
                <th className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center text-sm text-[var(--foreground-muted)]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center text-sm text-[var(--foreground-muted)]"
                  >
                    No se encontraron órdenes en el rango seleccionado
                  </td>
                </tr>
              ) : (
                data.items.map((order) => (
                    <tr
                      key={order.orderId}
                      className="transition-colors hover:bg-slate-900/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {order.unpricedCount > 0 && (
                            <Badge tone="warning" className="text-[10px] px-1.5 py-0">
                              ?
                            </Badge>
                          )}
                          <span className="font-mono text-xs text-[var(--accent)]">
                            {order.orderId.substring(0, 16)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--foreground)]">
                          {order.customer.name} {order.customer.lastName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setModalOrder(order)}
                          className="text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors underline underline-offset-2 decoration-slate-700 hover:decoration-[var(--accent)]"
                        >
                          {order.items.length} item
                          {order.items.length !== 1 && "s"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Price amount={order.totals.total} />
                      </td>
                      <td className="px-4 py-3">
                        {order.totalGain != null ? (
                          <span className="text-sm font-medium text-emerald-400">
                            +${order.totalGain.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-[var(--foreground-muted)]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.avgMargin != null ? (
                          <Badge
                            tone={
                              order.avgMargin > 30
                                ? "success"
                                : order.avgMargin >= 15
                                  ? "warning"
                                  : "danger"
                            }
                          >
                            {order.avgMargin.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-sm text-[var(--foreground-muted)]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--foreground-muted)]">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Cards - Mobile */}
      {!error && (
        <div className="space-y-3 lg:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 py-12 text-center text-sm text-[var(--foreground-muted)]">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Cargando...
              </div>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 py-12 text-center text-sm text-[var(--foreground-muted)]">
              No se encontraron órdenes en el rango seleccionado
            </div>
          ) : (
            data.items.map((order) => (
                <div
                  key={order.orderId}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:bg-slate-900/30"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--accent)]">
                          #{order.orderId.substring(0, 12)}
                        </span>
                        {order.unpricedCount > 0 && (
                          <Badge tone="warning" className="text-[10px] px-1.5 py-0">
                            ?
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-[var(--foreground)]">
                        {order.customer.name} {order.customer.lastName}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--foreground-muted)]">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* Summary row */}
                  <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-slate-900/50 p-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                        Total
                      </p>
                      <Price amount={order.totals.total} />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                        Ganancia
                      </p>
                      {order.totalGain != null ? (
                        <p className="text-sm font-semibold text-emerald-400">
                          +${order.totalGain.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--foreground-muted)]">
                          —
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                        Margen
                      </p>
                      {order.avgMargin != null ? (
                        <Badge
                          tone={
                            order.avgMargin > 30
                              ? "success"
                              : order.avgMargin >= 15
                                ? "warning"
                                : "danger"
                          }
                        >
                          {order.avgMargin.toFixed(1)}%
                        </Badge>
                      ) : (
                        <p className="text-sm text-[var(--foreground-muted)]">
                          —
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items detail button */}
                  <button
                    onClick={() => setModalOrder(order)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs text-[var(--foreground-muted)] hover:bg-slate-900/30 transition-colors border border-slate-800"
                  >
                    Ver detalle de {order.items.length} item
                    {order.items.length !== 1 && "s"}
                  </button>
                </div>
            ))
          )}
        </div>
      )}

      {/* ── Items Detail Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {modalOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModalOrder(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/40"
            >
              <button
                onClick={() => setModalOrder(null)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--foreground-muted)] transition hover:bg-slate-800 hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                <ShoppingCart className="h-6 w-6" />
              </div>

              <h3 className="text-center text-lg font-semibold text-[var(--foreground)]">
                Detalle de orden
              </h3>

              <p className="mt-1 text-center text-sm text-[var(--foreground-muted)]">
                #{modalOrder.orderId} · {modalOrder.customer.name} {modalOrder.customer.lastName}
              </p>

              <div className="mt-6 space-y-3">
                {modalOrder.items.map((item, idx) => (
                  <ItemRow key={idx} item={item} />
                ))}
                <TotalsBreakdown totals={modalOrder.totals} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {!error && data && data.totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <span className="text-sm text-[var(--foreground-muted)]">
            Página {data.page} de {data.totalPages} ({data.total} órdenes)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
