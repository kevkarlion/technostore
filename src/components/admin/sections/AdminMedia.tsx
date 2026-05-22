"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, Image, Trash2, Copy, Check } from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  date: string;
}

// Mock data
const mockMedia: MediaItem[] = [
  { id: "1", name: "product-hero-1.jpg", url: "/media/product-hero-1.jpg", type: "image/jpeg", size: "2.4 MB", date: "2026-05-20" },
  { id: "2", name: "banner-summer.png", url: "/media/banner-summer.png", type: "image/png", size: "1.8 MB", date: "2026-05-19" },
  { id: "3", name: "category-icon-monitor.svg", url: "/media/category-icon-monitor.svg", type: "image/svg+xml", size: "12 KB", date: "2026-05-18" },
  { id: "4", name: "logo-dark.png", url: "/media/logo-dark.png", type: "image/png", size: "45 KB", date: "2026-05-15" },
  { id: "5", name: "product-gallery-1.webp", url: "/media/product-gallery-1.webp", type: "image/webp", size: "890 KB", date: "2026-05-14" },
  { id: "6", name: "hero-background.jpg", url: "/media/hero-background.jpg", type: "image/jpeg", size: "3.2 MB", date: "2026-05-10" },
];

export default function AdminMedia() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [media] = useState<MediaItem[]>(mockMedia);

  const filteredMedia = media.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Media
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {filteredMedia.length} archivos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <div className="relative order-2 w-full sm:order-1 sm:w-auto sm:min-w-[200px] lg:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <Input
              placeholder="Buscar archivos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <div className="order-1 flex gap-2 sm:order-2">
            <Button iconLeft={<Upload className="h-4 w-4" />}>
              Subir archivo
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/30 px-4 py-8 sm:py-12 transition-colors hover:border-slate-700">
        <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-[var(--foreground-muted)]" />
        <p className="mt-3 text-center text-sm text-[var(--foreground-muted)]">
          Arrastra archivos o hacé clic para seleccionar
        </p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          PNG, JPG, WEBP, SVG · hasta 10MB
        </p>
      </div>

      {/* Media Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="group rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden transition-colors hover:bg-slate-900/30"
          >
            {/* Preview */}
            <div className="relative aspect-square bg-slate-900 flex items-center justify-center">
              <Image className="h-12 w-12 text-slate-700" />
              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-rose-400 hover:bg-rose-400/20">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {item.name}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-[var(--foreground-muted)]">
                  {item.size}
                </span>
                <button
                  onClick={() => copyToClipboard(item.url, item.id)}
                  className="flex items-center gap-1 text-xs text-[var(--accent)] transition-colors hover:text-[var(--accent)]/80"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copiar URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMedia.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 py-12">
          <Image className="h-12 w-12 text-[var(--foreground-muted)]" />
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            No se encontraron archivos
          </p>
        </div>
      )}
    </div>
  );
}