"use client";

import { useState, useEffect } from "react";
import { useOrderStore, type Order } from "@/store/order-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Check,
  X,
  Clock,
  RefreshCw,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { Toaster, toast } from "sonner";

const statusConfig: Record<
  Order["status"],
  { label: string; tone: "success" | "warning" | "danger" | "default" }
> = {
  pending: { label: "Pendiente", tone: "warning" },
  reserved: { label: "Reservado", tone: "warning" },
  captured: { label: "Cobrado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
  failed: { label: "Fallido", tone: "danger" },
};

const statusLabels: Record<Order["status"], string> = {
  pending: "Pendiente",
  reserved: "Reservado",
  captured: "Cobrado",
  cancelled: "Cancelado",
  failed: "Fallido",
};

export default function AdminOrders() {
  const { orders, updateOrder } = useOrderStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCapture = async (order: Order) => {
    setLoading(order.id);
    try {
      const response = await fetch("/api/mercadopago/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al capturar");
      }

      updateOrder(order.id, {
        status: "captured",
        statusDetail: result.status_detail,
      });
      toast.success("Pago capturado exitosamente");
    } catch (err) {
      console.error("[Admin] Capture error:", err);
      toast.error(err instanceof Error ? err.message : "Error al capturar");
    } finally {
      setLoading(null);
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

    setLoading(order.id);
    try {
      const response = await fetch("/api/mercadopago/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al cancelar");
      }

      updateOrder(order.id, {
        status: "cancelled",
        statusDetail: "Cancelled by merchant",
      });
      toast.success("Reserva cancelada - fondos liberados");
    } catch (err) {
      console.error("[Admin] Cancel error:", err);
      toast.error(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 py-16">
          <Clock className="h-12 w-12 text-[var(--foreground-muted)]" />
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            Cargando pedidos...
          </p>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.customerName || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (order.customerEmail || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

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
            {orders.length} pedidos registrados
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <Input
              placeholder="Buscar pedidos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
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

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
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
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-[var(--foreground-muted)]"
                >
                  {search
                    ? "No se encontraron pedidos"
                    : "No hay pedidos registrados. Completá una compra en la tienda para verlos aquí."}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.status];
                return (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-slate-900/30"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[var(--accent)]">
                        {order.id.substring(0, 20)}...
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {order.customerName || "-"}
                      </p>
                      {order.customerEmail && (
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {order.customerEmail}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Price amount={order.totalAmount} />
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
                      <div className="flex items-center justify-end gap-2">
                        {order.status === "reserved" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleCapture(order)}
                              disabled={loading === order.id}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {loading === order.id ? (
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
                              disabled={loading === order.id}
                              className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                              <X className="h-4 w-4" />
                              Cancelar
                            </Button>
                          </>
                        )}
                        {order.status === "captured" && (
                          <span className="text-xs text-emerald-400">
                            ✓ Completado
                          </span>
                        )}
                        {order.status === "cancelled" && (
                          <span className="text-xs text-rose-400">
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
    </div>
  );
}
