import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Price } from "@/components/ui/price";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.[0];

  // Si no hay imagen, mostrar un div con el nombre del producto
  if (!primaryImage) {
    return (
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View details for ${product.name}`}
      >
        <Card className="flex h-full flex-col overflow-hidden border-[var(--border-subtle)] bg-[var(--surface)]">
          <div className="flex h-48 items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-muted)] p-4 text-center">
            {product.name.substring(0, 40)}...
          </div>
          <CardTitle className="line-clamp-2 text-sm leading-snug p-3">
            {product.name}
          </CardTitle>
        </Card>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={`View details for ${product.name}`}
      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
    >
      <Card className="flex h-full flex-col overflow-hidden border-[var(--border-subtle)] bg-[var(--surface)] transition group-hover:border-[var(--accent)]/50 group-hover:bg-[var(--surface-hover)]">
        <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-[var(--background)]">
          <Image
            src={primaryImage.src}
            alt={primaryImage.alt}
            width={400}
            height={300}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            unoptimized
          />
          <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
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
        <CardTitle className="line-clamp-2 text-sm leading-snug">
          {product.name}
        </CardTitle>
        <CardDescription className="mt-1 line-clamp-2">
          {product.shortDescription}
        </CardDescription>
        <CardFooter className="mt-auto pt-3">
          <div>
            <Price amount={product.price} originalAmount={product.originalPrice} />
            <p className="mt-0.5 text-[0.7rem] text-[var(--foreground-muted)]">
              {product.brand} • {product.category}
            </p>
          </div>
          <div className="flex flex-col items-end text-[0.7rem] text-amber-300">
            <span>{product.rating.toFixed(1)} ★</span>
            <span className="text-[var(--foreground-muted)]">
              {product.ratingCount.toLocaleString()} reviews
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

