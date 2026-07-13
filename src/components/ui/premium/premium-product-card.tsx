"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { clsx } from "clsx";
import type { Product } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { GlassContainer } from "@/components/ui/premium/glass-container";
import { AnimatedBadge } from "@/components/ui/premium/animated-badge";
import { useMotionPreferences } from "@/lib/motion-config";

interface PremiumProductCardProps {
  product: Product;
  /** Show skeleton while loading */
  loading?: boolean;
  /** Index for stagger animation */
  index?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Premium Product Card with hover effects, image zoom, and badge animations
 *
 * Features:
 * - 1.05x image zoom on hover (200ms transition)
 * - Card elevation shadow with Y-axis lift
 * - Animated badges with entrance and pulse effects
 * - Respects prefers-reduced-motion
 */
export function PremiumProductCard({
  product,
  loading = false,
  index = 0,
  className,
}: PremiumProductCardProps) {
  const { reducedMotion } = useMotionPreferences();
  const [imageLoaded, setImageLoaded] = useState(false);
  const primaryImage = product.images?.[0];

  if (loading || !primaryImage) {
    return (
      <div
        className={clsx(
          "flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]",
          className
        )}
        aria-hidden="true"
      >
        <div className="mb-3 aspect-square w-full animate-pulse bg-white/[0.06]" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-auto pt-3">
          <div className="h-5 w-1/3 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.3, delay: index * 0.05 }}
      className="group"
    >
      <Link
        href={`/productos/${product.slug}`}
        aria-label={`View details for ${product.name}`}
        className="block focus-visible:outline-none"
      >
        <GlassContainer
          hover
          className={clsx(
            "flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]",
            "transition-all duration-300",
            "group-hover:border-[var(--accent)]/30 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]",
            "group-hover:-translate-y-1",
            className
          )}
        >
          {/* Image Container with zoom effect */}
          <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl bg-white flex items-center justify-center p-3">
            <motion.div
              className="relative h-full w-full"
              whileHover={reducedMotion ? {} : { scale: 1.05 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden" }}
            >
              <Image
                src={String(primaryImage?.src || "")}
                alt={String(primaryImage?.alt || "")}
                width={300}
                height={300}
                className={clsx(
                  "h-full w-full max-h-[180px] w-auto object-contain",
                  "transition-opacity duration-300",
                  !imageLoaded && "opacity-0"
                )}
                unoptimized
                onLoad={() => setImageLoaded(true)}
              />
            </motion.div>

            {/* Badges overlay */}
            <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
              {product.badges?.includes("new") && (
                <AnimatedBadge variant="new">New</AnimatedBadge>
              )}
              {product.badges?.includes("sale") && (
                <AnimatedBadge variant="sale" pulse>Sale</AnimatedBadge>
              )}
              {product.badges?.includes("featured") && (
                <AnimatedBadge variant="default">Featured</AnimatedBadge>
              )}
            </div>

            {/* Quick view overlay on hover */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200"
              initial={{ opacity: 0 }}
              whileHover={reducedMotion ? {} : { opacity: 1 }}
            >
              <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-gray-900 shadow-lg">
                Quick view
              </span>
            </motion.div>
          </div>

          {/* Product info */}
          <div className="flex flex-1 flex-col px-1">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--foreground)]">
              {product.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--foreground-muted)]">
              {product.shortDescription}
            </p>

            {/* Footer with price and rating */}
            <div className="mt-auto flex items-end justify-between pt-3">
              <div>
                <Price
                  amount={product.price}
                  originalAmount={product.originalPrice}
                  className="text-sm"
                />
                <p className="mt-0.5 text-[0.7rem] text-[var(--foreground-muted)]">
                  {product.brand} • {product.category}
                </p>
              </div>
              <div className="flex flex-col items-end text-[0.7rem] text-amber-300">
                {product.rating != null && product.rating > 0 && (
                  <>
                    <span>{product.rating.toFixed(1)} ★</span>
                    <span className="text-[var(--foreground-muted)]">
                      {product.ratingCount?.toLocaleString() || 0} reviews
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </GlassContainer>
      </Link>
    </motion.div>
  );
}

export default PremiumProductCard;