"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, GripVertical, Image as ImageIcon, Eye } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  order: number;
  active: boolean;
}

// Mock data
const mockBanners: Banner[] = [
  { id: "1", title: "Oferta Tech 2026", image: "/banners/summer-sale.jpg", link: "/offers/summer", order: 1, active: true },
  { id: "2", title: "Nuevos Monitores", image: "/banners/monitors.jpg", link: "/category/monitors", order: 2, active: true },
  { id: "3", title: "Periféricos Gaming", image: "/banners/gaming.jpg", link: "/category/peripherals", order: 3, active: false },
];

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>(mockBanners);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Banners
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {banners.length} banners configurados
          </p>
        </div>
        <Button iconLeft={<Plus className="h-4 w-4" />}>
          Crear banner
        </Button>
      </div>

      {/* Banners List */}
      <div className="space-y-3">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:bg-slate-900/30"
          >
            {/* Drag Handle */}
            <div className="cursor-grab text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Order Number */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-[var(--foreground-muted)]">
              {index + 1}
            </div>

            {/* Preview Image */}
            <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
              <ImageIcon className="h-6 w-6 text-[var(--foreground-muted)]" />
            </div>

            {/* Banner Info */}
            <div className="flex-1">
              <p className="font-medium text-[var(--foreground)]">
                {banner.title}
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                {banner.link}
              </p>
            </div>

            {/* Status */}
            <Badge tone={banner.active ? "success" : "default"}>
              {banner.active ? "Activo" : "Inactivo"}
            </Badge>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" title="Vista previa">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Editar">
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-400 hover:text-rose-300"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {banners.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 py-12">
          <ImageIcon className="h-12 w-12 text-[var(--foreground-muted)]" />
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            No hay banners todavía
          </p>
          <Button className="mt-4" iconLeft={<Plus className="h-4 w-4" />}>
            Crear primer banner
          </Button>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/20 p-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          <span className="font-medium text-[var(--foreground)]">Tip:</span> Arrastra los banners para reordenar su posición en el carrusel de la página principal.
        </p>
      </div>
    </div>
  );
}