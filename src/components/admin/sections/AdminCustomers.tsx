"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, MapPin, Eye } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  status: "active" | "inactive";
}

// Mock data
const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Martín García",
    email: "martin.garcia@email.com",
    phone: "+54 11 5555-1234",
    location: "Buenos Aires, AR",
    totalOrders: 8,
    totalSpent: 4599.00,
    lastOrder: "2026-05-20",
    status: "active",
  },
  {
    id: "2",
    name: "Ana Martínez",
    email: "ana.martinez@email.com",
    phone: "+54 11 5555-5678",
    location: "Córdoba, AR",
    totalOrders: 5,
    totalSpent: 2340.50,
    lastOrder: "2026-05-19",
    status: "active",
  },
  {
    id: "3",
    name: "Carlos López",
    email: "carlos.lopez@email.com",
    phone: "+54 11 5555-9012",
    location: "Rosario, AR",
    totalOrders: 12,
    totalSpent: 8750.00,
    lastOrder: "2026-05-15",
    status: "active",
  },
  {
    id: "4",
    name: "Laura Fernández",
    email: "laura.fernandez@email.com",
    phone: "+54 11 5555-3456",
    location: "Mendoza, AR",
    totalOrders: 2,
    totalSpent: 450.00,
    lastOrder: "2026-05-10",
    status: "inactive",
  },
];

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [customers] = useState<Customer[]>(mockCustomers);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {filteredCustomers.length} clientes registrados
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:bg-slate-900/30"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  <span className="text-sm font-semibold">
                    {customer.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {customer.name}
                  </p>
                  <Badge
                    tone={customer.status === "active" ? "success" : "default"}
                    className="mt-1"
                  >
                    {customer.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            {/* Contact Info */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <Mail className="h-4 w-4" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <MapPin className="h-4 w-4" />
                <span>{customer.location}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
              <div>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Pedidos
                </p>
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {customer.totalOrders}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--foreground-muted)]">
                  Total gastado
                </p>
                <p className="text-lg font-semibold text-[var(--accent)]">
                  ${customer.totalSpent.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Last Order */}
            <div className="mt-3 text-xs text-[var(--foreground-muted)]">
              Último pedido: {customer.lastOrder}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 py-12">
          <p className="text-sm text-[var(--foreground-muted)]">
            No se encontraron clientes
          </p>
        </div>
      )}
    </div>
  );
}