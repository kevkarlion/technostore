"use client";

import { motion } from "framer-motion";
import { useMotionPreferences, TRANSITION, EASE, staggerContainer } from "@/lib/motion-config";
import { clsx } from "clsx";

/**
 * Category data interface
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  /** Image URL or gradient color for placeholder */
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
  { id: "1", name: "PCs Gamer", slug: "pcs-gamer", gradient: "from-blue-600 to-blue-800" },
  { id: "2", name: "Combos Gamer", slug: "combos-gamer", gradient: "from-purple-600 to-purple-800" },
  { id: "3", name: "Periféricos", slug: "perifericos", gradient: "from-cyan-600 to-cyan-800" },
  { id: "4", name: "Monitores", slug: "monitores", gradient: "from-green-600 to-green-800" },
  { id: "5", name: "Componentes", slug: "componentes", gradient: "from-orange-600 to-orange-800" },
  { id: "6", name: "Streaming", slug: "streaming", gradient: "from-pink-600 to-pink-800" },
  { id: "7", name: "Sillas Gamer", slug: "sillas-gamer", gradient: "from-red-600 to-red-800" },
  { id: "8", name: "Notebooks", slug: "notebooks", gradient: "from-indigo-600 to-indigo-800" },
];

/**
 * CategoryShowcase - Visual grid of product categories with images and hover effects
 *
 * Features:
 * - 2-column grid on mobile, 4-column on desktop
 * - Horizontal scroll with snap on mobile
 * - Hover effects: scale(1.03), border accent, shadow
 * - Aspect ratio 4:3 for images
 */
export function CategoryShowcase({
  categories = defaultCategories,
  className,
}: CategoryShowcaseProps) {
  const { reducedMotion } = useMotionPreferences();

  // Mobile: horizontal scroll container
  // Desktop: 4-column grid

  return (
    <div className={clsx("space-y-4", className)}>
      <motion.h2
        className="text-2xl font-bold text-[var(--foreground)]"
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        whileInView={{ opacity: reducedMotion ? 1 : 1 }}
        viewport={{ once: true }}
      >
        Categorías
      </motion.h2>

      {/* Mobile: horizontal scroll with snap */}
      {/* Desktop: 4-column grid */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
        {categories.map((category, index) => (
          <motion.a
            key={category.id}
            href={`/category/${category.slug}`}
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: reducedMotion ? 0 : index * 0.05,
              duration: TRANSITION.medium,
              ease: EASE.standard,
            }}
            className="group relative block aspect-[4/3] w-[160px] flex-shrink-0 overflow-hidden rounded-xl md:w-auto"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Background gradient/image */}
            <div
              className={clsx(
                "absolute inset-0 bg-gradient-to-br transition-transform duration-300 group-hover:scale-105",
                category.gradient || "from-gray-600 to-gray-800"
              )}
            />

            {/* Hover overlay with border */}
            <div
              className={clsx(
                "absolute inset-0 rounded-xl border-2 border-transparent",
                "transition-all duration-200",
                "group-hover:border-[var(--accent)] group-hover:shadow-lg group-hover:shadow-[var(--accent)]/20"
              )}
            />

            {/* Bottom overlay with category name */}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
              <span className="text-sm font-medium text-white group-hover:text-[var(--accent)] transition-colors">
                {category.name}
              </span>
            </div>

            {/* Scale on hover - external container */}
            <div className="absolute inset-0 scale-100 transition-transform duration-200 group-hover:scale-[1.03]" />
          </motion.a>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default CategoryShowcase;
