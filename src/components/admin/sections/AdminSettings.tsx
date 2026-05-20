"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Store, CreditCard, Truck, Bell } from "lucide-react";

export default function AdminSettings() {
  const [storeName, setStoreName] = useState("TechnoStore");
  const [storeDescription, setStoreDescription] = useState(
    "Tu tienda de tecnología favorita"
  );
  const [contactEmail, setContactEmail] = useState("contacto@technostore.com");
  const [contactPhone, setContactPhone] = useState("+54 11 5555-0000");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Ajustes
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Configura tu tienda
          </p>
        </div>
        <Button iconLeft={<Save className="h-4 w-4" />}>Guardar cambios</Button>
      </div>

      {/* Store Settings */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
            <Store className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Información de la tienda
            </h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              Datos básicos de tu tienda
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Nombre de la tienda
              </label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Email de contacto
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Descripción
            </label>
            <textarea
              className="min-h-[100px] w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none transition focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Descripción de tu tienda..."
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Teléfono de contacto
            </label>
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
            <CreditCard className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Pago
            </h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              Configura los métodos de pago
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 p-4">
            <div>
              <p className="font-medium text-[var(--foreground)]">
                Mercado Pago
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Procesa pagos con tarjeta, efectivo o transferencia
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-400">
                Activo
              </span>
            </div>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Configuración de pago próximamente...
          </p>
        </div>
      </div>

      {/* Shipping Settings */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
            <Truck className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Envíos
            </h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              Configura las opciones de envío
            </p>
          </div>
        </div>

        <p className="text-sm text-[var(--foreground-muted)]">
          Configuración de envíos próximamente...
        </p>
      </div>

      {/* Notifications Settings */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10">
            <Bell className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Notificaciones
            </h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              Configura cómo recibir notificaciones
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: "Nuevos pedidos", description: "Recibe un email cuando arrives un nuevo pedido" },
            { label: "Pagos recibidos", description: "Notificación cuando se confirma un pago" },
            { label: "Stock bajo", description: "Alerta cuando un producto tiene poco stock" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 p-4"
            >
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {item.label}
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {item.description}
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-700 bg-slate-800 text-[var(--accent)]"
                defaultChecked
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}