"use client";

import { useMemo } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import type { Category } from "@/domain/models/category";
import { buildCategoryTree, type CategoryTreeNode } from "@/domain/models/category";

// Las 13 categorías principales de jotakp.dyndns.org (Almacenamiento a Seguridad)
// Las subcategorías tienen slugs que coinciden con la DB (ej: "mouse-perifericos", no "mouse")
export const JOTAKP_CATEGORIES = [
  {
    name: "Almacenamiento",
    slug: "almacenamiento",
    subcategories: [
      { name: "Carry-Caddy Disk", slug: "carry-caddy-disk" },
      { name: "CD-DVD-BluRay-Dual Layer", slug: "cd-dvd-bluray" },
      { name: "Discos Externos", slug: "discos-externos" },
      { name: "Discos HDD", slug: "discos-hdd" },
      { name: "Discos M.2", slug: "discos-m2" },
      { name: "Discos SSD", slug: "discos-ssd" },
      { name: "Memorias Flash", slug: "memorias-flash" },
      { name: "Pendrive", slug: "pendrive" },
    ],
  },
  {
    name: "Audio",
    slug: "audio",
    subcategories: [
      { name: "Auricular Bluetooth", slug: "auricular-bluetooth" },
      { name: "Auricular Cableado", slug: "auricular-cableado" },
      { name: "Conversores y Adaptadores", slug: "conversores-adaptadores-audio" },
      { name: "Microfonos", slug: "microfonos" },
      { name: "Parlantes", slug: "parlantes" },
      { name: "Placas de Sonido", slug: "placas-de-sonido" },
      { name: "Reproductor CD-DVD-MP3-Vinilo", slug: "reproductor-cd-dvd-mp3" },
      { name: "Sintonizadores", slug: "sintonizadores" },
    ],
  },
  {
    name: "Cables",
    slug: "cables",
    subcategories: [
      { name: "Cable Audio", slug: "cable-audio" },
      { name: "Cable Celulares", slug: "cable-celulares" },
      { name: "Cable Energia", slug: "cable-energia" },
      { name: "Cable Hardware", slug: "cable-hardware" },
      { name: "Cable Impresora", slug: "cable-impresora" },
      { name: "Cable Video", slug: "cable-video" },
    ],
  },
  {
    name: "Computadoras",
    slug: "computadoras",
    subcategories: [
      { name: "Accesorios", slug: "accesorios-computadoras" },
      { name: "AIO", slug: "aio" },
      { name: "Bases de Notebook", slug: "bases-notebook" },
      { name: "Cargadores", slug: "cargadores-computadoras" },
      { name: "Fundas-Mochilas-Bolsos", slug: "fundas-mochilas-bolsos" },
      { name: "Licencias y Servidores", slug: "licencias-servidores" },
      { name: "Mini Pc", slug: "mini-pc" },
      { name: "Notebooks", slug: "notebooks" },
      { name: "Pantallas", slug: "pantallas-computadoras" },
      { name: "Pc", slug: "pc" },
      { name: "Servidores", slug: "servidores" },
      { name: "Soportes", slug: "soportes-computadoras" },
      { name: "Tablets", slug: "tablets" },
    ],
  },
  {
    name: "Conectividad",
    slug: "conectividad",
    subcategories: [
      { name: "Antenas", slug: "antenas" },
      { name: "Conectores", slug: "conectores" },
      { name: "Extensores", slug: "extensores" },
      { name: "Patch Cord", slug: "patch-cord" },
      { name: "Patch Panel", slug: "patch-panel" },
      { name: "Placas de Red", slug: "placas-de-red" },
      { name: "Puntos de Acceso", slug: "puntos-de-acceso" },
      { name: "Rack", slug: "rack" },
      { name: "Routers", slug: "routers" },
      { name: "Switches", slug: "switches" },
      { name: "UTP-FTP", slug: "utp-ftp" },
    ],
  },
  {
    name: "Energia",
    slug: "energia",
    subcategories: [
      { name: "Adaptador", slug: "adaptador-energia" },
      { name: "Baterias", slug: "baterias" },
      { name: "Cargadores", slug: "cargadores-energia" },
      { name: "Estabilizadores", slug: "estabilizadores" },
      { name: "Led", slug: "led" },
      { name: "Linterna", slug: "linterna" },
      { name: "Pilas", slug: "pilas" },
      { name: "Ups", slug: "ups" },
      { name: "Zapatillas", slug: "zapatillas" },
    ],
  },
  {
    name: "Gaming",
    slug: "gaming",
    subcategories: [
      { name: "Accesorios", slug: "accesorios-gaming" },
      { name: "Auricular Gamer", slug: "auricular-gamer" },
      { name: "Combo Gamer", slug: "combo-gamer" },
      { name: "Consolas", slug: "consolas" },
      { name: "Joysticks", slug: "joysticks" },
      { name: "Mouse Gamer", slug: "mouse-gamer" },
      { name: "Silla Gamer", slug: "silla-gamer" },
      { name: "Teclado Gamer", slug: "teclado-gamer" },
    ],
  },
  {
    name: "Hardware",
    slug: "hardware",
    subcategories: [
      { name: "Conversores y Adaptadores", slug: "conversores-adaptadores-hardware" },
      { name: "Coolers y Disipadores", slug: "coolers-disipadores" },
      { name: "Fuentes", slug: "fuentes" },
      { name: "Gabinetes", slug: "gabinetes" },
      { name: "Grabadoras", slug: "grabadoras" },
      { name: "Memorias", slug: "memorias" },
      { name: "Memorias Notebooks", slug: "memorias-notebooks" },
      { name: "Microprocesadores", slug: "microprocesadores" },
      { name: "Motherboard", slug: "motherboard" },
      { name: "Placas de Video", slug: "placas-de-video" },
    ],
  },
  {
    name: "Imagen",
    slug: "imagen",
    subcategories: [
      { name: "Camaras y Filmadoras", slug: "camaras-filmadoras" },
      { name: "Conversores y Adaptadores", slug: "conversores-adaptadores-imagen" },
      { name: "Monitores-TV", slug: "monitores-tv" },
      { name: "Pantallas", slug: "pantallas-imagen" },
      { name: "Proyectores", slug: "proyectores" },
      { name: "Scanner", slug: "scanner" },
      { name: "Sintonizadora", slug: "sintonizadora" },
      { name: "Smartwatch", slug: "smartwatch" },
      { name: "Soportes", slug: "soportes-imagen" },
      { name: "Streaming", slug: "streaming" },
    ],
  },
  {
    name: "Impresion",
    slug: "impresion",
    subcategories: [
      { name: "3D", slug: "impresion-3d" },
      { name: "Cajas CD-DVD-BLURAY", slug: "cajas-cd-dvd-bluray" },
      { name: "Cartuchos Alternativos", slug: "cartuchos-alternativos" },
      { name: "Cartuchos Originales", slug: "cartuchos-originales" },
      { name: "Cintas Para Impresion", slug: "cintas-impresion" },
      { name: "Impresoras", slug: "impresoras" },
      { name: "Resmas", slug: "resmas" },
      { name: "Tintas Alternativas", slug: "tintas-alternativas" },
      { name: "Tintas Originales", slug: "tintas-originales" },
      { name: "Toners Alternativos", slug: "toners-alternativos" },
      { name: "Toners Alternativos Outlet", slug: "toners-alternativos-outlet" },
      { name: "Toners Originales", slug: "toners-originales" },
      { name: "Toners Originales Outlet", slug: "toners-originales-outlet" },
    ],
  },
  {
    name: "Perifericos",
    slug: "perifericos",
    subcategories: [
      { name: "Lectores", slug: "lectores" },
      { name: "Mouse", slug: "mouse-perifericos" },
      { name: "Pad", slug: "pad" },
      { name: "Tableta Grafica y Presentadores", slug: "tableta-grafica" },
      { name: "Teclados", slug: "teclados-perifericos" },
      { name: "Ventilador USB", slug: "ventilador-usb" },
      { name: "Webcams", slug: "webcams" },
    ],
  },
  {
    name: "Seguridad",
    slug: "seguridad",
    subcategories: [
      { name: "Accesorios", slug: "accesorios-seguridad" },
      { name: "Alarmas", slug: "alarmas" },
      { name: "Alarmas - Accesorios", slug: "alarmas-accesorios" },
      { name: "Balun", slug: "balun" },
      { name: "Camaras CCTV", slug: "camaras-cctv" },
      { name: "Camaras IP", slug: "camaras-ip" },
      { name: "Control de Acceso", slug: "control-de-acceso" },
      { name: "DVR-NVR", slug: "dvr-nvr" },
      { name: "Fuentes", slug: "fuentes-seguridad" },
      { name: "Kit Seguridad", slug: "kit-seguridad" },
      { name: "Porteria", slug: "porteria" },
      { name: "Soporte", slug: "soporte-seguridad" },
    ],
  },
  {
    name: "Telefonia",
    slug: "telefonia",
    subcategories: [
      { name: "Accesorios", slug: "accesorios-telefonia" },
      { name: "Celulares", slug: "celulares" },
      { name: "Centrales Telefonicas", slug: "centrales-telefonicas" },
      { name: "Telefonos", slug: "telefonos" },
    ],
  },
  {
    name: "Varios",
    slug: "varios",
    subcategories: [
      { name: "Armado y Testeo de PC", slug: "armado-testeo-pc" },
      { name: "Electro", slug: "electro" },
      { name: "Herramientas", slug: "herramientas" },
      { name: "Limpieza y Mantenimiento", slug: "limpieza-mantenimiento" },
      { name: "Navajas y Cuchillos", slug: "navajas-cuchillos" },
      { name: "Oficina", slug: "oficina" },
      { name: "Outlet", slug: "outlet-varios" },
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
      // Ahora sub es un objeto { name, slug }
      return {
        id: `${cat.slug}-${sub.slug}`,
        name: sub.name,
        slug: sub.slug,
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