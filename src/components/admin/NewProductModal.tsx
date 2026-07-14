"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Loader2,
  Upload,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import CategoryDropdown from "./CategoryDropdown";

interface NewProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  cloudinaryUrl?: string;
  uploading: boolean;
  error?: string;
}

const defaultForm = {
  name: "",
  description: "",
  costPrice: "",
  profitMargin: "",
  currency: "USD",
  stock: "0",
  status: "draft" as const,
};

type FormErrors = Partial<Record<keyof typeof defaultForm, string>>;

export default function NewProductModal({
  open,
  onClose,
  onSuccess,
}: NewProductModalProps) {
  const [form, setForm] = useState({ ...defaultForm });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate price preview
  const calculatedPrice = (() => {
    const cost = parseFloat(form.costPrice) || 0;
    const margin = parseFloat(form.profitMargin) || 0;
    if (cost > 0 && margin >= 0) {
      return Math.round(cost * (1 + margin / 100) * 100) / 100;
    }
    return null;
  })();

  // Cargar categorías al abrir el modal
  useEffect(() => {
    if (!open) return;
    setLoadingCategories(true);
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.items || []);
      })
      .catch((err) => {
        console.error("[NewProduct] Error loading categories:", err);
        toast.error("Error al cargar categorías");
      })
      .finally(() => setLoadingCategories(false));
  }, [open]);

  // Limpiar previews al cerrar
  useEffect(() => {
    if (!open) {
      setForm({ ...defaultForm });
      setErrors({});
      setSelectedCategories(new Set());
      setImages([]);
    }
  }, [open]);

  if (!open) return null;

  const set =
    (field: keyof typeof defaultForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: UploadedImage[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
    }));
    setImages((prev) => [...prev, ...newImages]);

    // Subir cada imagen a Cloudinary
    files.forEach((file) => uploadToCloudinary(file));
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al subir imagen");
      }

      const data = await res.json();

      setImages((prev) =>
        prev.map((img) =>
          img.file === file
            ? { ...img, cloudinaryUrl: data.url, uploading: false }
            : img
        )
      );
    } catch (err) {
      console.error("[NewProduct] Upload error:", err);
      setImages((prev) =>
        prev.map((img) =>
          img.file === file
            ? {
                ...img,
                uploading: false,
                error: err instanceof Error ? err.message : "Error al subir",
              }
            : img
        )
      );
      toast.error("Error al subir imagen");
    }
  };

  const removeImage = (index: number) => {
    const img = images[index];
    URL.revokeObjectURL(img.preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 3)
      errs.name = "Mínimo 3 caracteres";
    const costPrice = parseFloat(form.costPrice);
    if (!form.costPrice.trim() || isNaN(costPrice) || costPrice < 0)
      errs.costPrice = "Costo inválido";
    const profitMargin = parseFloat(form.profitMargin);
    if (form.profitMargin.trim() && isNaN(profitMargin))
      errs.profitMargin = "Margen inválido";
    const stock = parseInt(form.stock, 10);
    if (isNaN(stock) || stock < 0) errs.stock = "Stock inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const imageUrls = images
        .map((img) => img.cloudinaryUrl)
        .filter(Boolean) as string[];

      const costPrice = parseFloat(form.costPrice);
      const profitMargin = parseFloat(form.profitMargin) || 0;

      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        costPrice,
        profitMargin,
        currency: form.currency,
        stock: parseInt(form.stock, 10),
        inStock: parseInt(form.stock, 10) > 0,
        status: form.status,
        categories: Array.from(selectedCategories),
        imageUrls,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al crear producto");
      }

      toast.success("Producto creado");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("[NewProduct] Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Error al crear producto"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const allUploaded = images.every(
    (img) => !img.uploading || img.cloudinaryUrl
  );
  const canSubmit =
    allUploaded && !images.some((img) => img.uploading && !img.cloudinaryUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Nuevo Producto
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--foreground-muted)] transition hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Nombre *
            </label>
            <Input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="Nombre del producto"
              className={errors.name ? "border-rose-500" : ""}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-400">{errors.name}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-emerald-500 focus:outline-none"
              placeholder="Descripción del producto"
            />
          </div>

          {/* Costo + Margen */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Costo (USD) *
              </label>
              <Input
                type="number"
                value={form.costPrice}
                onChange={set("costPrice")}
                placeholder="0.00"
                step="0.01"
                className={errors.costPrice ? "border-rose-500" : ""}
              />
              {errors.costPrice && (
                <p className="mt-1 text-xs text-rose-400">{errors.costPrice}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Margen (%)
              </label>
              <Input
                type="number"
                value={form.profitMargin}
                onChange={set("profitMargin")}
                placeholder="0"
                step="0.1"
                className={errors.profitMargin ? "border-rose-500" : ""}
              />
              {errors.profitMargin && (
                <p className="mt-1 text-xs text-rose-400">{errors.profitMargin}</p>
              )}
            </div>
          </div>

          {/* Precio calculado */}
          {calculatedPrice !== null && (
            <div className="rounded-lg border border-emerald-800/30 bg-emerald-500/5 p-3">
              <p className="text-sm text-[var(--foreground-muted)]">
                Precio de venta (calculado)
              </p>
              <p className="text-xl font-bold text-emerald-400">
                ${calculatedPrice.toFixed(2)} USD
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {form.costPrice} × (1 + {(parseFloat(form.profitMargin) || 0) / 100}) = ${calculatedPrice.toFixed(2)}
              </p>
            </div>
          )}

          {/* Stock + Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Stock
              </label>
              <Input
                type="number"
                value={form.stock}
                onChange={set("stock")}
                placeholder="0"
                className={errors.stock ? "border-rose-500" : ""}
              />
              {errors.stock && (
                <p className="mt-1 text-xs text-rose-400">{errors.stock}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Estado
              </label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-[var(--foreground)] focus:border-emerald-500 focus:outline-none"
              >
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Categorías */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Categorías
            </label>
            <CategoryDropdown
              categories={categories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              loading={loadingCategories}
            />
          </div>

          {/* Imágenes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Imágenes
            </label>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 px-4 py-6 transition hover:border-emerald-500/50 hover:bg-slate-900"
            >
              <Upload className="h-6 w-6 text-[var(--foreground-muted)]" />
              <p className="text-sm text-[var(--foreground-muted)]">
                Hacé clic para subir imágenes
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                PNG, JPG, WebP
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview grid */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="group relative aspect-square">
                    <img
                      src={img.cloudinaryUrl || img.preview}
                      alt={`Imagen ${i + 1}`}
                      className="h-full w-full rounded-lg object-cover"
                    />
                    {/* Overlay de subiendo */}
                    {img.uploading && !img.cloudinaryUrl && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                      </div>
                    )}
                    {/* Error */}
                    {img.error && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                        <p className="px-2 text-center text-xs text-rose-400">
                          Error
                        </p>
                      </div>
                    )}
                    {/* Delete button */}
                    {!img.uploading && img.cloudinaryUrl && (
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 hidden rounded-lg bg-red-950/80 p-1 text-red-400 transition hover:bg-red-900 group-hover:block"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !canSubmit}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Producto"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
