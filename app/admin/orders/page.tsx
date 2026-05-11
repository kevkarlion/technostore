"use client";

import { useState, useEffect } from "react";
import { useOrderStore, type Order } from "@/store/order-store";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Toaster, toast } from "sonner";

export default function AdminOrdersPage() {
  const { orders, updateOrder } = useOrderStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
        statusDetail: result.status_detail 
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
    if (!confirm("¿Estás seguro de cancelar esta reserva? Se liberarán los fondos.")) {
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
        statusDetail: "Cancelled by merchant"
      });
      toast.success("Reserva cancelada - fondos liberados");
    } catch (err) {
      console.error("[Admin] Cancel error:", err);
      toast.error(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "reserved":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
      case "captured":
        return "bg-green-500/20 text-green-400 border-green-500";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500";
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

  if (!isClient) {
    return null;
  }

  const pendingOrders = orders.filter(o => o.status === "reserved");

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Gestión de Pedidos
        </h1>
        <p className="text-xs text-slate-400">
          Administrá las reservas de Mercado Pago
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          No hay pedidos registrados
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOrders.length > 0 && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <h2 className="text-sm font-medium text-yellow-400 mb-2">
                ⚠️ {pendingOrders.length} reserva(s) pendientes de captura
              </h2>
              <p className="text-xs text-yellow-400/70">
                Los fondos están reservados pero no cobrados. Tenés 5 días para capturar o cancelar.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">Orden</th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">Cliente</th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">Monto</th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">Estado</th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">Fecha</th>
                  <th className="p-3 text-left text-xs font-medium text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/50">
                    <td className="p-3">
                      <span className="font-mono text-xs text-slate-300">
                        {order.id.substring(0, 20)}...
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      {order.customerName || order.customerEmail || "-"}
                    </td>
                    <td className="p-3">
                      <Price amount={order.totalAmount} />
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex rounded px-2 py-1 text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status === "reserved" && "Reservado"}
                        {order.status === "captured" && "Cobrado"}
                        {order.status === "cancelled" && "Cancelado"}
                        {order.status === "failed" && "Fallido"}
                        {order.status === "pending" && "Pendiente"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-400">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-3">
                      {order.status === "reserved" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleCapture(order)}
                            disabled={loading === order.id}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {loading === order.id ? "..." : "Capturar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(order)}
                            disabled={loading === order.id}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                      {order.status === "captured" && (
                        <span className="text-xs text-green-400">✓ Completado</span>
                      )}
                      {order.status === "cancelled" && (
                        <span className="text-xs text-red-400">✗ Cancelado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}