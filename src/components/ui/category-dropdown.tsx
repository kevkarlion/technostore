"use client";

import { useMemo } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import type { Category } from "@/domain/models/category";
import { buildCategoryTree, type CategoryTreeNode } from "@/domain/models/category";

// Las 13 categorías principales de jotakp.dyndns.org (Almacenamiento a Seguridad)
// Se usan como fallback cuando no hay categorías de la DB
export const JOTAKP_CATEGORIES = [
  {
    name: "Almacenamiento",
    slug: "almacenamiento",
    subcategories: [
      "Carry-Caddy Disk",
      "CD-DVD-BluRay-Dual Layer",
      "Discos Externos",
      "Discos HDD",
      "Discos M.2",
      "Discos SSD",
      "Memorias Flash",
      "Pendrive",
    ],
  },
  {
    name: "Audio",
    slug: "audio",
    subcategories: [
      "Auricular Bluetooth",
      "Auricular Cableado",
      "Conversores y Adaptadores",
      "Microfonos",
      "Parlantes",
      "Placas de Sonido",
      "Reproductor CD-DVD-MP3-Vinilo",
      "Sintonizadores",
    ],
  },
  {
    name: "Cables",
    slug: "cables",
    subcategories: [
      "Cable Audio",
      "Cable Celulares",
      "Cable Energia",
      "Cable Hardware",
      "Cable Impresora",
      "Cable Video",
    ],
  },
  {
    name: "Computadoras",
    slug: "computadoras",
    subcategories: [
      "Accesorios",
      "AIO",
      "Bases de Notebook",
      "Cargadores",
      "Fundas-Mochilas-Bolsos",
      "Licencias y Servidores",
      "Mini Pc",
      "Notebooks",
      "Pantallas",
      "Pc",
      "Servidores",
      "Soportes",
      "Tablets",
    ],
  },
  {
    name: "Conectividad",
    slug: "conectividad",
    subcategories: [
      "Antenas",
      "Conectores",
      "Extensores",
      "Patch Cord",
      "Patch Panel",
      "Placas de Red",
      "Puntos de Acceso",
      "Rack",
      "Routers",
      "Switches",
      "UTP-FTP",
    ],
  },
  {
    name: "Energia",
    slug: "energia",
    subcategories: [
      "Adaptador",
      "Baterias",
      "Cargadores",
      "Estabilizadores",
      "Led",
      "Linterna",
      "Pilas",
      "Ups",
      "Zapatillas",
    ],
  },
  {
    name: "Gaming",
    slug: "gaming",
    subcategories: [
      "Accesorios",
      "Auricular Gamer",
      "Combo Gamer",
      "Consolas",
      "Joysticks",
      "Mouse Gamer",
      "Silla Gamer",
      "Teclado Gamer",
    ],
  },
  {
    name: "Hardware",
    slug: "hardware",
    subcategories: [
      "Conversores y Adaptadores",
      "Coolers y Disipadores",
      "Fuentes",
      "Gabinetes",
      "Grabadoras",
      "Memorias",
      "Memorias Notebooks",
      "Microprocesadores",
      "Motherboard",
      "Placas de Video",
    ],
  },
  {
    name: "Imagen",
    slug: "imagen",
    subcategories: [
      "Camaras y Filmadoras",
      "Conversores y Adaptadores",
      "Monitores-TV",
      "Pantallas",
      "Proyectores",
      "Scanner",
      "Sintonizadora",
      "Smartwatch",
      "Soportes",
      "Streaming",
    ],
  },
  {
    name: "Impresion",
    slug: "impresion",
    subcategories: [
      "3D",
      "Cajas CD-DVD-BLURAY",
      "Cartuchos Alternativos",
      "Cartuchos Originales",
      "Cintas Para Impresion",
      "Impresoras",
      "Resmas",
      "Tintas Alternativas",
      "Tintas Originales",
      "Toners Alternativos",
      "Toners Alternativos Outlet",
      "Toners Originales",
      "Toners Originales Outlet",
    ],
  },
  {
    name: "Perifericos",
    slug: "perifericos",
    subcategories: [
      "Lectores",
      "Mouse",
      "Pad",
      "Tableta Grafica y Presentadores",
      "Teclados",
      "Ventilador USB",
      "Webcams",
    ],
  },
  {
    name: "Seguridad",
    slug: "seguridad",
    subcategories: [
      "Accesorios",
      "Alarmas",
      "Alarmas - Accesorios",
      "Balun",
      "Camaras CCTV",
      "Camaras IP",
      "Control de Acceso",
      "DVR-NVR",
      "Fuentes",
      "Kit Seguridad",
      "Porteria",
      "Soporte",
    ],
  },
  {
    name: "Telefonia",
    slug: "telefonia",
    subcategories: [
      "Accesorios",
      "Celulares",
      "Centrales Telefonicas",
      "Telefonos",
    ],
  },
  {
    name: "Varios",
    slug: "varios",
    subcategories: [
      "Armado y Testeo de PC",
      "Electro",
      "Herramientas",
      "Limpieza y Mantenimiento",
      "Navajas y Cuchillos",
      "Oficina",
      "Outlet",
    ],
  },
];

// Crear árbol de categorías desde JOTAKP_CATEGORIES (static fallback)
function getStaticCategoryTree() {
  return JOTAKP_CATEGORIES.map((cat) => ({
    id: cat.slug,
    name: cat.name,
    slug: cat.slug,
    children: cat.subcategories.map((sub) => {
      // Generate slug: "carry-caddy-disk" for the subcategory
      const subSlug = sub.toLowerCase().replace(/\s+/g, "-");
      return {
        id: `${cat.slug}-${subSlug}`,
        name: sub,
        slug: subSlug, // Just the subcategory slug, not the full path
        children: [],
      };
    }),
  }));
}

export interface CategoryDropdownProps {
  categories?: Category[];
  className?: string;
}

function CategoryItem({
  node,
  depth = 0,
}: {
  node: CategoryTreeNode;
  depth?: number;
}) {
  const hasChildren = node.children.length > 0;

  // Root level items with children - clicking does nothing, only hover shows dropdown
  if (depth === 0 && hasChildren) {
    return (
      <li className="relative group">
        <button
          type="button"
          className={clsx(
            "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium cursor-default",
            "text-[var(--foreground-muted)] transition-colors",
            "hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          )}
        >
          {node.name}
          <svg
            className="h-3 w-3 transition-transform group-hover:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {/* Submenu - appears on hover. pointer-events-none until hover to prevent accidental trigger */}
        <ul className="pointer-events-none absolute left-0 top-full z-50 mt-0 min-w-[160px] rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-1 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          {node.children.map((child) => (
            <CategoryItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      </li>
    );
  }

  // For submenu items, show nested dropdown on hover
  if (hasChildren) {
    return (
      <li className="relative group">
        <Link
          href={`/category/${node.slug}`}
          className={clsx(
            "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs",
            "text-[var(--foreground-muted)] transition-colors",
            "hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          )}
        >
          {node.name}
          <svg
            className="h-3 w-3 rotate-[-90deg]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </Link>
        {/* Nested submenu - appears on hover */}
        <ul className="absolute left-full top-0 z-50 ml-1 min-w-[160px] rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] p-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {node.children.map((child) => (
            <CategoryItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      </li>
    );
  }

  // No children - simple link
  return (
    <li>
      <Link
        href={`/category/${node.slug}`}
        className={clsx(
          "flex w-full rounded-md px-2 py-1.5 text-xs",
          "text-[var(--foreground-muted)] transition-colors",
          "hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        )}
      >
        {node.name}
      </Link>
    </li>
  );
}

export function CategoryDropdown({
  categories = [],
  className,
}: CategoryDropdownProps) {
  // SIEMPRE usar el static fallback de jotakp para mostrar exactamente como el sitio original
  // Las categorías de la DB se usarán en las páginas de categoría, no en el navbar principal
  const categoryTree = getStaticCategoryTree();

  return (
    // Use flex directly on ul instead of nav wrapper to avoid triggering dropdowns when hovering between items
    <ul className={clsx("flex flex-wrap items-center gap-1", className)}>
      {categoryTree.map((node) => (
        <CategoryItem key={node.id} node={node} depth={0} />
      ))}
    </ul>
  );
}