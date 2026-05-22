"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, MapPin, Eye, RefreshCw, AlertTriangle } from "lucide-react";

interface CustomerOrder {
  orderId: string;
  total: number;
  status: string;
  createdAt: string;
}

interface Customer {
  _id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  address: string;
  street: string;
  number: string;
  floor?: string | null;
  apartment?: string | null;
  tower?: string | null;
  province: string;
  city: string;
  postalCode: string;
  additionalInstructions?: string | null;
  saveAddress: boolean;
  sameForBilling: boolean;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  orders: CustomerOrder[];
  status: "active" | "inactive";
}

interface FetchResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 20;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (searchTerm: string, page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("page", String(page));
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar clientes");
      const data: FetchResponse = await res.json();

      setCustomers(data.items || []);
      setTotalItems(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("[AdminCustomers] Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(search, currentPage);
  }, [currentPage, fetchCustomers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-800/50 bg-rose-950/20 py-16">
          <AlertTriangle className="h-12 w-12 text-rose-400" />
          <p className="mt-4 text-sm text-rose-400">{error}</p>
          <Button onClick={() => fetchCustomers(search, currentPage)} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {loading
              ? "Cargando..."
              : search
              ? `${totalItems} resultados para "${search}"`
              : `${totalItems} clientes registrados`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <div className="relative order-2 w-full sm:order-1 sm:w-auto sm:min-w-[200px] lg:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <Input
              placeholder="Buscar clientes..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <div className="order-1 flex gap-2 sm:order-2">
            <Button
              variant="outline"
              onClick={() => fetchCustomers(search, currentPage)}
              disabled={loading}
              className="px-3 sm:px-4"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="ml-1.5 hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && customers.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-800" />
                  <div className="h-3 w-20 rounded bg-slate-800" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-slate-800" />
                <div className="h-3 w-3/4 rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customers Grid */}
      {!loading && customers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 py-16">
          <UsersIcon className="h-12 w-12 text-[var(--foreground-muted)]" />
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            {search
              ? `No se encontraron clientes para "${search}"`
              : "No hay clientes registrados. Cuando alguien realice una compra, aparecerá aquí automáticamente."}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <div
            key={customer._id}
            className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:bg-slate-900/30"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  <span className="text-sm font-semibold">
                    {customer.name.charAt(0)}{customer.lastName.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--foreground)]">
                    {customer.name} {customer.lastName}
                  </p>
                  <Badge
                    tone={customer.status === "active" ? "success" : "default"}
                    className="mt-1"
                  >
                    {customer.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0" title="Ver detalle">
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            {/* Contact Info */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] min-w-0">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate">{customer.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-[var(--foreground-muted)]">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="truncate">
                    {customer.street} {customer.number}
                    {customer.floor && `, Piso ${customer.floor}`}
                    {customer.apartment && `, Depto ${customer.apartment}`}
                    {customer.tower && `, Torre ${customer.tower}`}
                  </p>
                  <p className="truncate text-xs text-[var(--foreground-muted)]">
                    {customer.city}, {customer.province} · CP {customer.postalCode}
                  </p>
                </div>
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
                  {formatCurrency(customer.totalSpent)}
                </p>
              </div>
            </div>

            {/* Last Order + Recent orders */}
            <div className="mt-3 text-xs text-[var(--foreground-muted)]">
              Último pedido: {formatDate(customer.lastOrderDate)}
            </div>

            {/* Recent orders (max 2) */}
            {customer.orders.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {customer.orders.slice(-3).reverse().map((order) => (
                  <div
                    key={order.orderId}
                    className="flex items-center justify-between rounded-md bg-slate-900/50 px-2.5 py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] text-[var(--foreground-muted)] truncate">
                        #{order.orderId.substring(0, 10)}
                      </span>
                      <Badge
                        tone={
                          order.status === "captured"
                            ? "success"
                            : order.status === "cancelled" || order.status === "failed"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {order.status === "captured"
                          ? "Cobrado"
                          : order.status === "reserved"
                          ? "Reservado"
                          : order.status}
                      </Badge>
                    </div>
                    <span className="text-xs font-medium text-[var(--foreground)] shrink-0">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-center text-sm text-[var(--foreground-muted)] sm:text-left">
            Página {currentPage} de {totalPages}
            <span className="hidden sm:inline"> · {totalItems} clientes</span>
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
    </div>
  );
}

// Inline icon component to avoid import
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
