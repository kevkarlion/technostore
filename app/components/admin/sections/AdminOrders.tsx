"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, X, Check, Clock } from "lucide-react";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: number;
}

// Mock data
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "Martín García",
    email: "martin.garcia@email.com",
    date: "2026-05-20",
    total: 459.99,
    status: "pending",
    items: 2,
  },
  {
    id: "ORD-002",
    customer: "Ana Martínez",
    email: "ana.martinez@email.com",
    date: "2026-05-20",
    total: 1299.00,
    status: "processing",
    items: 1,
  },
  {
    id: "ORD-003",
    customer: "Carlos López",
    email: "carlos.lopez@email.com",
    date: "2026-05-19",
    total: 89.99,
    status: "shipped",
    items: 3,
  },
  {
    id: "ORD-004",
    customer: "Laura Fernández",
    email: "laura.fernandez@email.com",
    date: "2026-05-19",
    total: 234.50,
    status: "delivered",
    items: 1,
  },
  {
    id: "ORD-005",
    customer: "Pedro Sánchez",
    email: "pedro.sanchez@email.com",
    date: "2026-05-18",
    total: 599.00,
    status: "cancelled",
    items: 2,
  },
];

const statusConfig: Record<OrderStatus, { label: string; tone: "default" | "success" | "warning" | "danger" }> = {
  pending: { label: "Pendiente", tone: "warning" },
  processing: { label: "Procesando", tone: "default" },
  shipped: { label: "Enviado", tone: "default" },
  delivered: { label: "Entregado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [orders] = useState<Order[]>(mockOrders);

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.toLowerCase().includes(search.toLowerCase()) ||
      order.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {filteredOrders.length} pedidos encontrados
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

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Pedido
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredOrders.map((order) => {
              const statusInfo = statusConfig[order.status];
              return (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-slate-900/30"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-[var(--accent)]">
                      {order.id}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {order.customer}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {order.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--foreground-muted)]">
                      {order.date}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      ${order.total.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 py-12">
          <Clock className="h-12 w-12 text-[var(--foreground-muted)]" />
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            No se encontraron pedidos
          </p>
        </div>
      )}
    </div>
  );
}