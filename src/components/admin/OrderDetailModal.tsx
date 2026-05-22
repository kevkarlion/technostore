"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Package, User, Receipt, Clock } from "lucide-react";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
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

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  const statusInfo = statusConfig[order.status];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-12"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)] shrink-0">
                Orden
              </h2>
              <span className="font-mono text-[10px] sm:text-xs text-[var(--accent)] truncate">
                #{order.orderId.substring(0, 8)}
              </span>
              <Badge tone={statusInfo.tone} className="shrink-0">{statusInfo.label}</Badge>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition hover:bg-slate-800 hover:text-[var(--foreground)] shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Products Section */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Productos
                </h3>
                <span className="text-xs text-[var(--foreground-muted)]">
                  ({order.items.length} item{order.items.length !== 1 && "s"})
                </span>
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                        Producto
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium uppercase text-[var(--foreground-muted)]">
                        Cant.
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium uppercase text-[var(--foreground-muted)]">
                        P. Unit.
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium uppercase text-[var(--foreground-muted)]">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {order.items.map((item) => (
                      <tr
                        key={item.productId}
                        className="transition-colors hover:bg-slate-900/30"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm text-[var(--foreground)]">
                            {item.productName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-[var(--foreground-muted)]">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Price amount={item.unitPrice} className="justify-end" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Price
                            amount={item.unitPrice * item.quantity}
                            className="justify-end"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards for items */}
              <div className="space-y-2 sm:hidden">
                {order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-lg border border-slate-800 bg-slate-900/30 p-3"
                  >
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {item.productName}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-[var(--foreground-muted)]">
                        {item.quantity} × <Price amount={item.unitPrice} />
                      </span>
                      <span className="font-medium text-[var(--foreground)]">
                        <Price amount={item.unitPrice * item.quantity} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Customer Section */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Cliente
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Nombre
                  </p>
                  <p className="text-sm text-[var(--foreground)]">
                    {order.customer.name} {order.customer.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Email
                  </p>
                  <p className="text-sm text-[var(--accent)]">
                    {order.customer.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Teléfono
                  </p>
                  <p className="text-sm text-[var(--foreground)]">
                    {order.customer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Dirección
                  </p>
                  <p className="text-sm text-[var(--foreground)]">
                    {order.customer.address}, {order.customer.city}{" "}
                    CP {order.customer.postalCode}
                  </p>
                </div>
              </div>
            </section>

            {/* Totals & Payment Section */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
              {/* Totals */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Totales
                  </h3>
                </div>
                <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">
                      Subtotal
                    </span>
                    <Price amount={order.totals.subtotal} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">
                      Envío
                    </span>
                    <Price amount={order.totals.shipping} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">
                      IVA (21%)
                    </span>
                    <Price amount={order.totals.taxes} />
                  </div>
                  <div className="flex justify-between border-t border-slate-700 pt-2 text-sm font-semibold text-[var(--foreground)]">
                    <span>Total</span>
                    <Price amount={order.totals.total} />
                  </div>
                </div>
              </section>

              {/* Payment */}
              {order.payment && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      Pago
                    </h3>
                  </div>
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                    {order.payment.paymentId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--foreground-muted)]">
                          ID Pago
                        </span>
                        <span className="font-mono text-xs text-[var(--foreground)]">
                          {order.payment.paymentId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--foreground-muted)]">
                        Método
                      </span>
                      <span className="text-[var(--foreground)]">
                        {order.payment.paymentMethodId || "-"}
                      </span>
                    </div>
                    {order.payment.installments && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--foreground-muted)]">
                          Cuotas
                        </span>
                        <span className="text-[var(--foreground)]">
                          {order.payment.installments}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--foreground-muted)]">
                        Estado
                      </span>
                      <Badge tone={statusInfo.tone}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Timeline */}
            {order.timeline && order.timeline.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Timeline
                  </h3>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="space-y-3">
                    {order.timeline.map((entry, i) => {
                      const entryStatus =
                        statusConfig[entry.status] || statusConfig.pending;
                      return (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ring-2 ${
                                i === order.timeline.length - 1
                                  ? "bg-[var(--accent)] ring-[var(--accent)]/30"
                                  : "bg-slate-600 ring-slate-700/50"
                              }`}
                            />
                            {i < order.timeline.length - 1 && (
                              <div className="h-full w-px bg-slate-700" />
                            )}
                          </div>
                          <div className="pb-3">
                            <div className="flex items-center gap-2">
                              <Badge tone={entryStatus.tone}>
                                {entryStatus.label}
                              </Badge>
                              <span className="text-xs text-[var(--foreground-muted)]">
                                {formatDate(entry.timestamp)}
                              </span>
                            </div>
                            {entry.detail && (
                              <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                                {entry.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
