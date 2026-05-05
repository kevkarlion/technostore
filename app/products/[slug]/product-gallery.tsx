"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { AddToCartButton } from "./add-to-cart-button";

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const images = product.images;
  const hasMultipleImages = images.length > 1;
  const heroImage = images[selectedImageIndex];
  const hasSpecs = Object.keys(product.specs).length > 0;
  const hasDescription = product.shortDescription && product.shortDescription.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid max-w-5xl mx-auto grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-12">
        {/* LEFT COLUMN - Image Gallery */}
        <section className="space-y-3">
          {/* Main Image - estilo ML */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white flex items-center justify-center">
            {heroImage ? (
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
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
            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
              {product.badges?.includes("new") && (
                <Badge tone="success">New</Badge>
              )}
              {product.badges?.includes("sale") && (
                <Badge tone="danger">Sale</Badge>
              )}
              {product.badges?.includes("featured") && (
                <Badge tone="default">Featured</Badge>
              )}
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {hasMultipleImages && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    selectedImageIndex === index
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)]"
                      : "border-transparent hover:border-[var(--accent)]/50"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    src={img.src}
                    alt={`${img.alt} thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN - Product Details & Add to Cart */}
        <section className="space-y-4">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
              {product.brand} • {product.category}
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
              {product.name}
            </h1>
          </header>

          <div className="space-y-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
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
                <p className={product.inStock ? "text-emerald-300" : "text-rose-300"}>
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
        </section>
      </div>

      {/* Full-width: Description & Technical specs */}
      <div className="max-w-5xl mx-auto mt-6">
        {/* Product Description - estilo ML */}
        {hasDescription && (
          <div className="bg-[var(--surface)] rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
              Descripción
            </h2>
            <p className="text-base text-[var(--foreground-muted)] leading-relaxed">
              {product.shortDescription}
            </p>
          </div>
        )}

        {/* Technical specifications - solo si existe */}
        {hasSpecs && (
          <section aria-label="Technical specifications" className="mt-4 bg-[var(--surface)] rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
              Características Técnicas
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-[var(--foreground-muted)]">{key}</dt>
                  <dd className="text-[var(--foreground)] font-medium text-right">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
