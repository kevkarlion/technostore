"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useInView } from "framer-motion";
import { clsx } from "clsx";

/**
 * Category data interface
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  /** Image URL */
  image?: string;
  /** Fallback gradient for placeholder */
  gradient?: string;
}

/**
 * Props for CategoryShowcase component
 */
interface CategoryShowcaseProps {
  /** Array of categories to display */
  categories?: Category[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default categories for TechnoStore
 */
const defaultCategories: Category[] = [
  { id: "1", name: "Cargadores Notebook", slug: "cargadores-alternativos-notebook", image: "/cargadores.png", gradient: "from-blue-600 to-blue-800" },
  { id: "2", name: "SSD", slug: "ssd", image: "/ssd.png", gradient: "from-purple-600 to-purple-800" },
  { id: "3", name: "Micro SD", slug: "micro-sd", image: "/pendrive.png", gradient: "from-cyan-600 to-cyan-800" },
  { id: "4", name: "Pendrive", slug: "pendrive", image: "/pendrive.png", gradient: "from-green-600 to-green-800" },
  { id: "5", name: "Mouse", slug: "mouse-gamer-oficina", image: "/mouse.png", gradient: "from-orange-600 to-orange-800" },
  { id: "6", name: "Teclados", slug: "teclados-gamer-oficina", image: "/teclados.png", gradient: "from-pink-600 to-pink-800" },
  { id: "7", name: "Routers/Extensores", slug: "routers-extensores", image: "/routers.png", gradient: "from-red-600 to-red-800" },
  { id: "8", name: "Adaptadores", slug: "adaptadores-hdmi-vga-wifi-bt", image: "/adaptadores.png", gradient: "from-indigo-600 to-indigo-800" },
];

/**
 * CategoryCard - Card individual con imagen real
 */
function CategoryCard({ category }: { category: Category }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [imageError, setImageError] = useState(false);

  const hasImage = category.image && !imageError;

  return (
    <a
      ref={ref}
      href={`/categorias/${category.slug}`}
      className="group relative block aspect-square overflow-hidden rounded-xl"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.5s ease, transform 0.5s ease`,
        contain: "layout paint",
      }}
    >
      {/* Background: imagen o gradiente fallback */}
      {hasImage ? (
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={clsx(
            "absolute inset-0 bg-gradient-to-br",
            category.gradient || "from-gray-600 to-gray-800"
          )}
        />
      )}

      {/* Overlay para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Hover border */}
      <div
        className={clsx(
          "absolute inset-0 rounded-xl border-2 border-transparent",
          "transition-all duration-200",
          "group-hover:border-[var(--accent)] group-hover:shadow-lg group-hover:shadow-[var(--accent)]/20"
        )}
      />

      {/* Category name */}
      <div className="absolute inset-0 flex items-end p-3">
        <span className="text-sm font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
          {category.name}
        </span>
      </div>
    </a>
  );
}

/**
 * CategoryShowcase - Grid de categorías con imágenes reales
 *
 * Features:
 * - 2-column grid on mobile, 4-column on desktop
 * - Imágenes reales con fallback a gradientes
 * - Animación sutil de entrada optimizada para iOS
 */
export function CategoryShowcase({
  categories = defaultCategories,
  className,
}: CategoryShowcaseProps) {
  return (
    <div className={clsx("space-y-4", className)}>
      <h2 className="text-2xl font-bold text-[var(--foreground)]">
        Categorías
      </h2>

      {/* Grid: 2 columnas mobile, 4 desktop */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {categories.map((category, index) => (
          <div
            key={category.id}
            style={{ transitionDelay: `${index * 60}ms` }}
          >
            <CategoryCard category={category} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryShowcase;