"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

interface CategoryDropdownProps {
  categories: Category[];
  selected: Set<string>;
  onChange: (slugs: Set<string>) => void;
  loading?: boolean;
}

export default function CategoryDropdown({
  categories,
  selected,
  onChange,
  loading,
}: CategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Agrupar: padres e hijos
  const parents = categories.filter((c) => !c.parentId);
  const childrenByParent = new Map<string, Category[]>();
  for (const cat of categories) {
    if (cat.parentId) {
      const list = childrenByParent.get(cat.parentId) || [];
      list.push(cat);
      childrenByParent.set(cat.parentId, list);
    }
  }

  const toggle = (slug: string) => {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange(next);
  };

  const selectAllForParent = (parentSlug: string, add: boolean) => {
    const children = childrenByParent.get(parentSlug) || [];
    const next = new Set(selected);
    for (const child of children) {
      if (add) next.add(child.slug);
      else next.delete(child.slug);
    }
    onChange(next);
  };

  const totalSelected = selected.size;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm transition hover:border-slate-600"
      >
        <span
          className={
            totalSelected > 0
              ? "text-[var(--foreground)]"
              : "text-[var(--foreground-muted)]"
          }
        >
          {loading
            ? "Cargando..."
            : totalSelected > 0
            ? `${totalSelected} categoría${totalSelected !== 1 ? "s" : ""} seleccionada${totalSelected !== 1 ? "s" : ""}`
            : "Seleccionar categorías"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--foreground-muted)] transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 sm:max-h-72 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--foreground-muted)]" />
            </div>
          ) : parents.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-[var(--foreground-muted)]">
              No hay categorías disponibles
            </p>
          ) : (
            <div className="py-1">
              {parents.map((parent) => {
                const children = childrenByParent.get(parent.slug) || [];
                const selectedChildren = children.filter((c) =>
                  selected.has(c.slug)
                ).length;
                const allSelected = selectedChildren === children.length;
                const someSelected = selectedChildren > 0 && !allSelected;

                return (
                  <div key={parent.id}>
                    {/* Parent header */}
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => toggle(parent.slug)}
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          selected.has(parent.slug)
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-slate-600"
                        }`}
                      >
                        {selected.has(parent.slug) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                        {parent.name}
                      </span>
                      {children.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAllForParent(parent.slug, !allSelected);
                          }}
                          className="ml-auto text-xs text-emerald-500 hover:text-emerald-400"
                        >
                          {allSelected ? "Deseleccionar todo" : `Seleccionar todo (${children.length})`}
                        </button>
                      )}
                    </div>

                    {/* Children */}
                    {children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggle(child.slug)}
                        className="flex w-full items-center gap-3 px-3 py-1.5 pl-8 text-left text-sm transition hover:bg-slate-800"
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            selected.has(child.slug)
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-600"
                          }`}
                        >
                          {selected.has(child.slug) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </span>
                        <span
                          className={
                            selected.has(child.slug)
                              ? "text-[var(--foreground)]"
                              : "text-[var(--foreground-muted)]"
                          }
                        >
                          {child.name}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
