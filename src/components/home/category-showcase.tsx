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
  { id: "1", name: "Cargadores", slug: "cargadores-energia", image: "/cargadores.webp", gradient: "from-blue-600 to-blue-800" },
  { id: "2", name: "SSD", slug: "memorias", image: "/ssd.webp", gradient: "from-purple-600 to-purple-800" },
  { id: "3", name: "Micro SD", slug: "memorias-flash", image: "/micro-sd.webp", gradient: "from-cyan-600 to-cyan-800" },
  { id: "4", name: "Pendrive", slug: "pendrive", image: "/pendrive.webp", gradient: "from-green-600 to-green-800" },
  { id: "5", name: "Mouse", slug: "mouse-gamer", image: "/mouse.webp", gradient: "from-orange-600 to-orange-800" },
  { id: "6", name: "Teclado", slug: "teclado-gamer", image: "/teclados.webp", gradient: "from-pink-600 to-pink-800" },
  { id: "7", name: "Router", slug: "routers", image: "/routers.webp", gradient: "from-red-600 to-red-800" },
  { id: "8", name: "Adaptadores", slug: "conversores-adaptadores-imagen", image: "/adaptadores.webp", gradient: "from-indigo-600 to-indigo-800" },
];

/**
 * Blur placeholder como data URL base64 (1x1 px transparente)
 */
const blurPlaceholder = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TDEAAAAvEAAAAEAcSARERAAABEFUd3eEAAA==";

/**
 * CategoryCard - Card individual con imagen optimizada Next.js
 */
function CategoryCard({ category, priority = false }: { category: Category; priority?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hasError, setHasError] = useState(false);

  const hasImage = category.image && !hasError;

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
          quality={80}
          priority={priority}
          placeholder="blur"
          blurDataURL={blurPlaceholder}
          onError={() => setHasError(true)}
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
 * CategoryShowcase - Grid de categorías con imágenes optimizadas Next.js
 *
 * Features:
 * - 2-column grid on mobile, 4-column on desktop
 * - Imágenes .webp optimizadas con Next.js Image
 * - Blur placeholder para loading suave
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
            <CategoryCard 
              category={category} 
              priority={index < 4} // Prioridad para primeras 4 imágenes
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryShowcase;