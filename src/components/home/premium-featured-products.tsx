"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { Price } from "@/components/ui/price";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types/domain";
import { isCatalogMode } from "@/lib/catalog-mode";

/**
 * Props for PremiumFeaturedProducts component
 */
interface PremiumFeaturedProductsProps {
  /** Array of products to display */
  products: Product[];
  /** Section title */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PremiumFeaturedProducts - Horizontal carousel of featured products
 *
 * Features:
 * - Horizontal scroll with snap behavior
 * - Hide scrollbar but allow swipe
 * - Navigation dots
 * - Mobile-first responsive design
 */
export function PremiumFeaturedProducts({
  products,
  title = "Productos Destacados",
  className,
}: PremiumFeaturedProductsProps) {
  const catalogMode = isCatalogMode();
  const [activeDot, setActiveDot] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 4;
  const totalDots = Math.ceil(products.length / itemsPerPage);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const itemWidth = containerRef.current.offsetWidth / itemsPerPage;
      const newDot = Math.round(scrollLeft / (itemWidth * itemsPerPage));
      setActiveDot(Math.min(newDot, totalDots - 1));
    }
  };

  const scrollLeft = () => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.offsetWidth;
      containerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.offsetWidth;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className={clsx("w-full", className)}>
      {title && (
        <h2 className="mb-4 text-xl font-bold text-[var(--foreground)]">{title}</h2>
      )}

      {/* Contenedor con flechas */}
      <div className="relative group">
        {/* Flecha izquierda - solo desktop */}
        <button
          onClick={scrollLeft}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 items-center justify-center w-10 h-10 rounded-full bg-zinc-800/90 border border-zinc-700 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-zinc-700"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Flecha derecha - solo desktop */}
        <button
          onClick={scrollRight}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 items-center justify-center w-10 h-10 rounded-full bg-zinc-800/90 border border-zinc-700 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-zinc-700"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scrollable container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className={clsx(
            "flex gap-4",
            "overflow-x-auto",
            "scroll-snap-x mandatory",
            "hide-scrollbar",
            "pb-2",
            // Mobile padding
            "px-4 md:px-0"
          )}
          style={{
            scrollBehavior: "smooth",
          }}
        >
        {products.map((product) => {
          const primaryImage = product.images?.[0];

          return (
            <div
              key={product.id}
              className={clsx(
                "w-[160px] shrink-0 md:w-[200px]",
                "scroll-snap-align-start"
              )}
            >
              <Link
                href={`/productos/${product.slug}`}
                className="group block"
                aria-label={`Ver ${product.name}`}
              >
                <div
                  className={clsx(
                    "relative aspect-square overflow-hidden rounded-xl",
                    "border border-[var(--border-subtle)] bg-[var(--surface)]",
                    "transition group-hover:border-[var(--accent)]/50",
                    "group-hover:shadow-lg"
                  )}
                >
                  {/* Product Image */}
                  {primaryImage ? (
                    <Image
                      src={String(primaryImage?.src || "")}
                      alt={String(primaryImage?.alt || "")}
                      width={200}
                      height={200}
                      className="h-full w-full object-contain p-2"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[var(--background)] p-2 text-center text-xs text-[var(--foreground-muted)]">
                      {product.name.substring(0, 30)}...
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="mt-2">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--foreground)]">
                    {product.name}
                  </h3>
                  {!catalogMode && (
                    <>
                      <div className="mt-1 flex items-center gap-1">
                        <Price
                          amount={product.price}
                          originalAmount={product.originalPrice}
                          convertToArs
                        />
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                        <span className="text-amber-400">{product.rating.toFixed(1)} ★</span>
                        <span>({product.ratingCount})</span>
                      </div>
                    </>
                  )}
                  {catalogMode && (
                    <span className="mt-1 inline-block text-xs font-medium text-[var(--accent)]">
                      Ver detalle →
                    </span>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

        </div>

      {/* Navigation dots - solo mobile */}
      {totalDots > 1 && (
        <div className="mt-4 flex justify-center gap-2 md:hidden">
          {Array.from({ length: totalDots }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (containerRef.current) {
                  const itemWidth = containerRef.current.offsetWidth / itemsPerPage;
                  containerRef.current.scrollTo({
                    left: index * itemWidth * itemsPerPage,
                    behavior: "smooth",
                  });
                }
                setActiveDot(index);
              }}
              aria-label={`Ir a página ${index + 1}`}
              className={clsx(
                "h-2 rounded-full transition-all",
                activeDot === index
                  ? "w-6 bg-[var(--accent)]"
                  : "w-2 bg-[var(--border-subtle)]"
              )}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default PremiumFeaturedProducts;
