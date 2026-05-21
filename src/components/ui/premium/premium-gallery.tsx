"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { Product, ProductImage } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { GlassContainer } from "@/components/ui/premium/glass-container";
import { AnimatedBadge } from "@/components/ui/premium/animated-badge";
import { useMotionPreferences } from "@/lib/motion-config";
import { AddToCartButton } from "../../../../app/(main)/productos/[slug]/add-to-cart-button";

interface PremiumGalleryProps {
  product: Product;
}

/**
 * PremiumGallery - Enhanced product gallery with crossfade, swipe gestures, and lightbox
 *
 * Features:
 * - Crossfade transitions (300ms) between images
 * - Swipe gestures with 30px threshold on touch devices
 * - Sticky purchase panel (desktop: top: 80px, mobile: fixed bottom)
 * - Expandable specs accordion (only one open at a time)
 * - Lightbox modal for image zoom
 */
export function PremiumGallery({ product }: PremiumGalleryProps) {
  const { reducedMotion } = useMotionPreferences();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<ProductImage | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Swipe gesture state
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const images = product.images;
  const hasMultipleImages = images.length > 1;
  const heroImage = images[selectedImageIndex];
  const hasSpecs = Object.keys(product.specs).length > 0;
  const hasDescription = product.shortDescription && product.shortDescription.length > 0;

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!hasMultipleImages) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      if (deltaX > 0 && selectedImageIndex > 0) {
        // Swipe right - previous image
        setSelectedImageIndex((i) => i - 1);
      } else if (deltaX < 0 && selectedImageIndex < images.length - 1) {
        // Swipe left - next image
        setSelectedImageIndex((i) => i + 1);
      }
    }
  }, [hasMultipleImages, selectedImageIndex, images.length]);

  // Lightbox keyboard handler
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  const openLightbox = useCallback((image: ProductImage) => {
    setLightboxImage(image);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxImage(null);
  }, []);

  const toggleAccordion = useCallback((key: string) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid max-w-5xl mx-auto grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-12">
        {/* LEFT COLUMN - Image Gallery */}
        <section className="space-y-3">
          {/* Main Image with crossfade */}
          <div
            className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white flex items-center justify-center cursor-zoom-in"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => heroImage && openLightbox(heroImage)}
            role="button"
            tabIndex={0}
            aria-label="Click to zoom image"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                heroImage && openLightbox(heroImage);
              }
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImageIndex}
                initial={{ opacity: reducedMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: reducedMotion ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {heroImage ? (
                  <Image
                    src={String(heroImage?.src || "")}
                    alt={String(heroImage?.alt || "")}
                    width={600}
                    height={600}
                    className="max-h-[500px] w-auto object-contain"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--foreground-muted)]">
                    No image
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Badges overlay */}
            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
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

            {/* Zoom hint */}
            <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                Click to zoom
              </span>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {hasMultipleImages && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <motion.button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={clsx(
                    "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                    selectedImageIndex === index
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/50"
                      : "border-transparent hover:border-[var(--accent)]/50"
                  )}
                  aria-label={`View image ${index + 1}`}
                  whileHover={reducedMotion ? {} : { scale: 1.05 }}
                  whileTap={reducedMotion ? {} : { scale: 0.95 }}
                >
                  <Image
                    src={String(img?.src || "")}
                    alt={String(img?.alt || `thumbnail ${index + 1}`)}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN - Sticky Product Details */}
        <section className="space-y-4 md:sticky md:top-[80px] md:self-start">
          <GlassContainer className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            <header className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                {product.brand} • {product.category}
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
                {product.name}
              </h1>
            </header>

            {/* Price and Rating */}
            <div className="space-y-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--background)]/50 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <Price
                  amount={product.price}
                  originalAmount={product.originalPrice}
                  className="text-lg"
                />
                <div className="text-right text-[0.7rem] text-[var(--foreground-muted)]">
                  <p>
                    {product.rating.toFixed(1)} ★ •{" "}
                    {product.ratingCount.toLocaleString()} reviews
                  </p>
                  <p className={product.inStock ? "text-emerald-400" : "text-rose-400"}>
                    {product.inStock ? "In stock" : "Out of stock"}
                  </p>
                </div>
              </div>
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                productPrice={product.price}
                productImageUrl={product.images[0]?.src}
                inStock={product.inStock}
                stockQuantity={product.stockQuantity}
              />
            </div>
          </GlassContainer>
        </section>
      </div>

      {/* Full-width: Description & Technical specs */}
      <div className="max-w-5xl mx-auto mt-6 space-y-4">
        {/* Product Description */}
        {hasDescription && (
          <GlassContainer className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
              Descripción
            </h2>
            <p className="text-base text-[var(--foreground-muted)] leading-relaxed">
              {product.shortDescription}
            </p>
          </GlassContainer>
        )}

        {/* Technical specifications accordion */}
        {hasSpecs && (
          <section aria-label="Technical specifications" className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--foreground)] px-2">
              Características Técnicas
            </h2>
            <div className="space-y-2">
              {Object.entries(product.specs).map(([key, value]) => {
                const isOpen = openAccordion === key;
                return (
                  <GlassContainer
                    key={key}
                    hover
                    className="overflow-hidden"
                  >
                    <button
                      onClick={() => toggleAccordion(key)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.04]"
                      aria-expanded={isOpen}
                      aria-controls={`spec-${key}`}
                    >
                      <span className="font-medium text-[var(--foreground)]">{key}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="text-[var(--foreground-muted)]"
                      >
                        ▼
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          id={`spec-${key}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[var(--border-subtle)] p-4 pt-3">
                            <p className="text-[var(--foreground)] font-medium">{String(value)}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassContainer>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
          >
            <motion.div
              initial={{ scale: reducedMotion ? 1 : 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: reducedMotion ? 1 : 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={String(lightboxImage?.src || "")}
                alt={String(lightboxImage?.alt || "")}
                width={1200}
                height={1200}
                className="max-h-[90vh] w-auto object-contain"
              />
              <button
                onClick={closeLightbox}
                className="absolute right-2 top-2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                aria-label="Close lightbox"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-subtle)] bg-[var(--background)]/95 backdrop-blur-lg p-4 md:hidden z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Price
              amount={product.price}
              originalAmount={product.originalPrice}
              className="text-lg font-semibold"
            />
            <p className="text-xs text-[var(--foreground-muted)]">
              {product.rating.toFixed(1)} ★
            </p>
          </div>
          <button
            onClick={() => {
              document.getElementById("add-to-cart")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Safe area padding for notched devices */}
      <div className="h-4 md:hidden" />
    </div>
  );
}

export default PremiumGallery;