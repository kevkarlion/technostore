"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Folder, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children?: Category[];
}

// Mock data
const mockCategories: Category[] = [
  {
    id: "1",
    name: "Monitores",
    slug: "monitores",
    productCount: 24,
    children: [
      { id: "1-1", name: "Gaming", slug: "monitores-gaming", productCount: 12 },
      { id: "1-2", name: "Profesional", slug: "monitores-profesional", productCount: 8 },
    ],
  },
  {
    id: "2",
    name: "Periféricos",
    slug: "perifericos",
    productCount: 156,
    children: [
      { id: "2-1", name: "Teclados", slug: "teclados", productCount: 45 },
      { id: "2-2", name: "Ratones", slug: "ratones", productCount: 52 },
      { id: "2-3", name: "Auriculares", slug: "auriculares", productCount: 38 },
    ],
  },
  { id: "3", name: "Audio", slug: "audio", productCount: 89 },
  { id: "4", name: "Cámaras", slug: "camaras", productCount: 34 },
  { id: "5", name: "Accesorios", slug: "accesorios", productCount: 112 },
];

export default function AdminCategories() {
  const [categories] = useState<Category[]>(mockCategories);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id}>
        <div
          className="flex items-center justify-between rounded-lg border border-slate-800/50 bg-slate-900/30 px-4 py-3 transition-colors hover:bg-slate-900/50"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <div className="flex items-center gap-3">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(category.id)}
                className="flex h-5 w-5 items-center justify-center rounded text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <Folder className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {category.name}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                /{category.slug}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge tone="default">{category.productCount} productos</Badge>
            <div className="flex gap-1">
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
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {category.children!.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Categorías
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {categories.length} categorías principales
          </p>
        </div>
        <Button iconLeft={<Plus className="h-4 w-4" />}>
          Añadir categoría
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-1">
        {categories.map((category) => renderCategory(category))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 py-12">
          <Folder className="h-12 w-12 text-[var(--foreground-muted)]" />
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            No hay categorías todavía
          </p>
          <Button className="mt-4" iconLeft={<Plus className="h-4 w-4" />}>
            Crear primera categoría
          </Button>
        </div>
      )}
    </div>
  );
}