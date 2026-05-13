"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import type { Product } from "@/types/domain";

/**
 * Badge type for featured products
 */
export type FeaturedBadge = "new" | "sale" | "featured" | "hot";

/**
 * Extended product interface for featured products
 */
export interface FeaturedProduct extends Product {
  featuredBadge?: FeaturedBadge;
}

/**
 * Props for PremiumFeaturedProducts component
 */
interface PremiumFeaturedProductsProps {
  /** Array of products to display */
  products: FeaturedProduct[];
  /** Section title */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge configuration based on type
 */
const badgeConfig: Record<FeaturedBadge, { label: string; className: string }> = {
  new: {
    label: "NUEVO",
    className: "bg-green-500 text-white",
  },
  sale: {
    label: "OFERTA",
    className: "bg-yellow-500 text-black",
  },
  featured: {
    label: "MÁS VENDIDO ★",
    className: "bg-rose-500 text-white",
  },
  hot: {
    label: "HOT SALE 🔥",
    className: "bg-red-600 text-white",
  },
};

/**
 * PremiumFeaturedProducts - Horizontal carousel of featured products with badges
 *
 * Features:
 * - Horizontal scroll with snap behavior
 * - Hide scrollbar but allow swipe
 * - Product badges (MÁS VENDIDO, NUEVO, HOT SALE, OFERTA)
 * - Navigation dots
 * - Mobile-first responsive design
 */
export function PremiumFeaturedProducts({
  products,
  title = "Productos Destacados",
  className,
}: PremiumFeaturedProductsProps) {
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

  return (
    <div className={clsx("w-full", className)}>
      {title && (
        <h2 className="mb-4 text-xl font-bold text-[var(--foreground)]">{title}</h2>
      )}

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
          const badge = product.featuredBadge;

          return (
            <div
              key={product.id}
              className={clsx(
                "w-[160px] shrink-0 md:w-[200px]",
                "scroll-snap-align-start"
              )}
            >
              <Link
                href={`/products/${product.slug}`}
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

                  {/* Badge overlay */}
                  {badge && (
                    <div className="absolute left-2 top-2">
                      <span
                        className={clsx(
                          "inline-block rounded-md px-2 py-1 text-xs font-bold",
                          badgeConfig[badge].className
                        )}
                      >
                        {badgeConfig[badge].label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="mt-2">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--foreground)]">
                    {product.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1">
                    <Price
                      amount={product.price}
                      originalAmount={product.originalPrice}
                    />
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                    <span className="text-amber-400">{product.rating.toFixed(1)} ★</span>
                    <span>({product.ratingCount})</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Navigation dots */}
      {totalDots > 1 && (
        <div className="mt-4 flex justify-center gap-2">
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
