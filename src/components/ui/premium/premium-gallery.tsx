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
import { getExchangeRate, formatARS } from "@/lib/exchange-rate";
import { isCatalogMode } from "@/lib/catalog-mode";

interface PremiumGalleryProps {
  product: Product;
}

// ============================================================================
// WHATSAPP BUTTON (catalog mode)
// ============================================================================

interface WhatsAppButtonProps {
  productName: string;
  productSlug: string;
}

function WhatsAppButton({ productName, productSlug }: WhatsAppButtonProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://technostore.vercel.app";
  const productUrl = `${baseUrl}/productos/${productSlug}`;
  const message = encodeURIComponent(`Hola! Quiero consultar por ${productName} - ${productUrl}`);
  const whatsappUrl = `https://wa.me/5492984130230?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#1ebe5a] transition-all shadow-lg shadow-[#25D366]/30"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.162-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span>Consultar por WhatsApp</span>
    </a>
  );
}

// ============================================================================
// PREMIUM GALLERY
// ============================================================================

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
  const [rate, setRate] = useState<number | null>(null);
  const catalogMode = isCatalogMode();

  useEffect(() => {
    getExchangeRate().then((data) => setRate(data?.venta ?? null));
  }, []);

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
            <header className="space-y-2 pb-1">
              <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                {product.brand} • {product.category}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                {product.name}
              </h1>
            </header>

            {/* Price and CTA */}
            <div className="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--background)]/50 p-5">
              {catalogMode ? (
                /* Catalog mode: WhatsApp consult button */
                <WhatsAppButton
                  productName={product.name}
                  productSlug={product.slug}
                />
              ) : (
                /* Normal mode: price + add-to-cart */
                <>
                  <div className="flex items-end justify-between gap-3">
                    <div className="space-y-1">
                      <Price
                        amount={product.priceARS ?? product.price}
                        originalAmount={product.originalPrice}
                        currency="ARS"
                        className="text-3xl sm:text-4xl"
                      />
                      {product.originalPrice && product.originalPrice > product.price && (
                        <p className="text-xs text-emerald-400 font-medium">
                          Ahorrá {formatARS(
                            (product.originalPrice - product.price) * (rate && rate > 0 ? rate : 1)
                          )}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {product.rating.toFixed(1)} ★
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {product.ratingCount.toLocaleString()} reviews
                      </p>
                    </div>
                  </div>
                  <AddToCartButton
                    productId={product.id}
                    productName={product.name}
                    productPrice={product.priceARS ?? product.price}
                    productImageUrl={product.images[0]?.src}
                    inStock={product.inStock}
                    stockQuantity={product.stockQuantity}
                  />
                </>
              )}
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
    </div>
  );
}

export default PremiumGallery;