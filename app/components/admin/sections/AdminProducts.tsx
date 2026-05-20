"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  status: "active" | "draft" | "archived";
}

// Mock data
const mockProducts: Product[] = [
  { id: "1", name: "Monitor LG UltraGear 27\"", price: 459.99, stock: 15, category: "Monitores", status: "active" },
  { id: "2", name: "Teclado Mecánico RGB", price: 129.99, stock: 42, category: "Periféricos", status: "active" },
  { id: "3", name: "Auriculares Sony WH-1000XM5", price: 349.99, stock: 8, category: "Audio", status: "active" },
  { id: "4", name: "Mouse Gaming Pro X", price: 79.99, stock: 65, category: "Periféricos", status: "active" },
  { id: "5", name: "Webcam 4K Ultra HD", price: 159.99, stock: 23, category: "Cámaras", status: "draft" },
];

const ITEMS_PER_PAGE = 10;

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [products] = useState<Product[]>(mockProducts);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Productos
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {filteredProducts.length} productos
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button iconLeft={<Plus className="h-4 w-4" />}>
            Añadir producto
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Categoría
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Precio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[var(--foreground-muted)]">
                Stock
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
            {paginatedProducts.map((product) => (
              <tr
                key={product.id}
                className="transition-colors hover:bg-slate-900/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                      <ImageIcon className="h-5 w-5 text-[var(--foreground-muted)]" />
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--foreground-muted)]">
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    ${product.price.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-sm font-medium ${
                      product.stock < 10
                        ? "text-rose-400"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      product.status === "active"
                        ? "success"
                        : product.status === "draft"
                        ? "warning"
                        : "default"
                    }
                  >
                    {product.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--foreground-muted)]">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}