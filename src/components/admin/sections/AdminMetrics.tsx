"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, DollarSign, Users } from "lucide-react";

export default function AdminMetrics() {
  // Mock data for demo
  const metrics = [
    {
      title: "Pedidos hoy",
      value: "24",
      change: "+12%",
      icon: Package,
      color: "text-blue-400",
    },
    {
      title: "Ingresos",
      value: "$8,450",
      change: "+8%",
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      title: "Clientes",
      value: "156",
      change: "+5%",
      icon: Users,
      color: "text-purple-400",
    },
    {
      title: "Tasa conversión",
      value: "3.2%",
      change: "+0.4%",
      icon: TrendingUp,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Métricas
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Resumen del rendimiento de tu tienda
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.title}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {metric.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
                    {metric.value}
                  </p>
                </div>
                <div
                  className={`rounded-lg bg-slate-900 p-2 ${metric.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                <Badge tone="success">{metric.change}</Badge>
                <span className="text-xs text-[var(--foreground-muted)]">
                  vs ayer
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Ingresos últimos 7 días
        </h2>
        <div className="mt-6 flex h-32 sm:h-48 items-end justify-between gap-2">
          {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-[var(--accent)]/20 transition-all hover:bg-[var(--accent)]/40"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-between text-xs text-[var(--foreground-muted)]">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>
      </div>

      {/* Top Products Placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Productos más vendidos
        </h2>
        <div className="mt-4 space-y-3">
          {[
            { name: "Monitor LG UltraGear 27&quot;", sales: 45 },
            { name: "Teclado Mecánico RGB", sales: 38 },
            { name: "Auriculares Sony WH-1000XM5", sales: 32 },
          ].map((product, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-slate-900/50 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xs font-medium text-[var(--accent)]">
                  {i + 1}
                </span>
                <span className="text-sm text-[var(--foreground)]">
                  {product.name}
                </span>
              </div>
              <span className="text-sm font-medium text-[var(--foreground-muted)]">
                {product.sales} ventas
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}