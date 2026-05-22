"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import {
  Search,
  Check,
  X,
  Clock,
  RefreshCw,
  ShoppingCart,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import type { Order } from "@/domain/models/order";

const statusConfig: Record<
  Order["status"],
  { label: string; tone: "success" | "warning" | "danger" | "default" }
> = {
  pending: { label: "Pendiente", tone: "warning" },
  reserved: { label: "Reservado", tone: "warning" },
  captured: { label: "Cobrado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
  failed: { label: "Fallido", tone: "danger" },
  refunded: { label: "Reintegrado", tone: "default" },
};

const formatDate = (timestamp: string | number | Date) => {
  return new Date(timestamp).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async (searchTerm = "", pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "20",
      });
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error("Error al cargar órdenes");

      const data = await res.json();
      setOrders(data.items);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("[AdminOrders] Fetch error:", err);
      toast.error("Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchOrders(value);
  };

  const handleRefresh = () => {
    fetchOrders(search);
  };

  const updateOrderStatusInDB = async (
    orderId: string,
    status: Order["status"],
    detail?: string
  ) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, detail }),
      });
    } catch (err) {
      console.error("[AdminOrders] Failed to update order in DB:", err);
    }
  };

  const handleCapture = async (order: Order) => {
    setActionLoading(order._id?.toString() || order.orderId);
    try {
      const response = await fetch("/api/mercadopago/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.payment?.paymentId || order.orderId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error al capturar");
      }

      // Update in MongoDB
      if (order._id) {
        await updateOrderStatusInDB(
          order._id.toString(),
          "captured",
          "Captured by merchant"
        );
      }

      toast.success("Pago capturado exitosamente");
      handleRefresh();
    } catch (err) {
      console.error("[Admin] Capture error:", err);
      toast.error(err instanceof Error ? err.message : "Error al capturar");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (order: Order) => {
    if (
      !confirm(
        "¿Estás seguro de cancelar esta reserva? Se liberarán los fondos."
      )
    ) {
      return;
    }

    setActionLoading(order._id?.toString() || order.orderId);
    try {
      const response = await fetch("/api/mercadopago/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.payment?.paymentId || order.orderId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Error al cancelar");
      }

      // Update in MongoDB
      if (order._id) {
        await updateOrderStatusInDB(
          order._id.toString(),
          "cancelled",
          "Cancelled by merchant"
        );
      }

      toast.success("Reserva cancelada - fondos liberados");
      handleRefresh();
    } catch (err) {
      console.error("[Admin] Cancel error:", err);
      toast.error(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = orders.filter((o) => o.status === "reserved").length;
  const capturedCount = orders.filter((o) => o.status === "captured").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {total} pedido{total !== 1 && "s"} registrado{total !== 1 && "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <div className="relative order-2 w-full sm:order-1 sm:w-auto sm:min-w-[200px] lg:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <Input
              placeholder="Buscar por cliente..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <div className="order-1 flex gap-2 sm:order-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {pendingCount}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Pendientes de captura
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <ShoppingCart className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {capturedCount}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Cobrados
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
                {cancelledCount}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Cancelados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="text-sm font-medium text-yellow-400">
              {pendingCount} reserva(s) pendiente(s) de captura
            </p>
          </div>
          <p className="mt-1 text-xs text-yellow-400/70 ml-7">
            Los fondos están reservados pero no cobrados. Tenés 5 días para
            capturar o cancelar.
          </p>
        </div>
      )}

      {/* Orders Table - Desktop */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Orden
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Productos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Monto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Fecha
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-[var(--foreground-muted)]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Cargando pedidos...
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-[var(--foreground-muted)]"
                >
                  {search
                    ? "No se encontraron pedidos"
                    : "No hay pedidos registrados. Completá una compra en la tienda para verlos aquí."}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusInfo = statusConfig[order.status];
                const orderId = order._id?.toString() || "";
                const isLoading = actionLoading === (orderId || order.orderId);
                return (
                  <tr
                    key={order.orderId}
                    className="transition-colors hover:bg-slate-900/30 cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[var(--accent)]">
                        {order.orderId.substring(0, 20)}...
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {order.customer.name} {order.customer.lastName}
                      </p>
                      {order.customer.email && (
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {order.customer.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--foreground-muted)]">
                        {order.items.length} item
                        {order.items.length !== 1 && "s"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Price amount={order.totals.total} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusInfo.tone}>
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--foreground-muted)]">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === "reserved" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleCapture(order)}
                              disabled={isLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
                            >
                              {isLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Capturar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(order)}
                              disabled={isLoading}
                              className="border-slate-700 text-slate-300 hover:bg-slate-800 whitespace-nowrap"
                            >
                              <X className="h-4 w-4" />
                              Cancelar
                            </Button>
                          </>
                        )}
                        {order.status === "captured" && (
                          <span className="text-xs text-emerald-400 whitespace-nowrap">
                            ✓ Completado
                          </span>
                        )}
                        {order.status === "cancelled" && (
                          <span className="text-xs text-rose-400 whitespace-nowrap">
                            ✗ Cancelado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Orders Cards - Mobile */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 py-12 text-center text-sm text-[var(--foreground-muted)]">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Cargando pedidos...
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 py-12 text-center text-sm text-[var(--foreground-muted)]">
            {search
              ? "No se encontraron pedidos"
              : "No hay pedidos registrados. Completá una compra en la tienda para verlos aquí."}
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = statusConfig[order.status];
            const orderId = order._id?.toString() || "";
            const isLoading = actionLoading === (orderId || order.orderId);
            return (
              <div
                key={order.orderId}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:bg-slate-900/30"
              >
                {/* Top row: status badge + date */}
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                {/* Order ID + Customer */}
                <div className="mt-2">
                  <span className="font-mono text-xs text-[var(--accent)]">
                    #{order.orderId.substring(0, 12)}
                  </span>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                    {order.customer.name} {order.customer.lastName}
                  </p>
                  {order.customer.email && (
                    <p className="text-xs text-[var(--foreground-muted)] truncate">
                      {order.customer.email}
                    </p>
                  )}
                </div>

                {/* Info row: items + total */}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {order.items.length} item{order.items.length !== 1 && "s"}
                  </span>
                  <Price amount={order.totals.total} />
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedOrder(order)}
                    title="Ver detalle"
                    className="flex-1"
                  >
                    <Eye className="mr-1.5 h-4 w-4" />
                    Ver detalle
                  </Button>
                  {order.status === "reserved" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleCapture(order)}
                        disabled={isLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isLoading ? (
                          <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-1.5 h-4 w-4" />
                        )}
                        Capturar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(order)}
                        disabled={isLoading}
                        className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <X className="mr-1.5 h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  {order.status === "captured" && (
                    <span className="flex-1 text-center text-xs font-medium text-emerald-400">
                      ✓ Cobrado
                    </span>
                  )}
                  {order.status === "cancelled" && (
                    <span className="flex-1 text-center text-xs font-medium text-rose-400">
                      ✗ Cancelado
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <span className="text-sm text-[var(--foreground-muted)]">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => fetchOrders(search, page - 1)}
            >
              ← Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => fetchOrders(search, page + 1)}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
