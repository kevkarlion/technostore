import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug, products } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { AddToCartButton } from "./add-to-cart-button";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }

  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return notFound();

  const heroImage = product.images[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
      <section className="space-y-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)]">
          {heroImage ? (
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
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
      </section>

      <section className="space-y-4">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
            {product.brand} • {product.category}
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {product.name}
          </h1>
          <p className="text-xs text-[var(--foreground-muted)]">{product.shortDescription}</p>
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
          <AddToCartButton productId={product.id} />
        </div>

        <section aria-label="Technical specifications" className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Technical specifications
          </h2>
          <dl className="grid grid-cols-1 gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 text-xs sm:grid-cols-2">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-0.5">
                <dt className="text-[0.7rem] uppercase tracking-wide text-[var(--foreground-muted)]">
                  {key}
                </dt>
                <dd className="text-[var(--foreground)]">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </section>
    </div>
  );
}

