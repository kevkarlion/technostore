import Link from "next/link";
import type { Product as CatalogProduct, CategorySlug } from "@/types/domain";
import type { Product as BackendProduct } from "@/domain/models/product";
import { categories } from "@/lib/mock-data";
import { ProductCard } from "@/features/catalog/components/product-card";
import { productService } from "@/api/services/product.service";

function mapBackendProductToCatalogProduct(
  product: BackendProduct
): CatalogProduct {
  const categorySlug =
    (product.categories[0] as CategorySlug | undefined) ?? "components";
  const primaryImageUrl = product.imageUrls[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.id,
    category: categorySlug,
    brand: "Generic",
    price: product.price,
    originalPrice: undefined,
    inStock: product.stock > 0,
    stockQuantity: product.stock,
    rating: 4.5,
    ratingCount: 0,
    badges: product.status === "active" ? ["featured"] : undefined,
    shortDescription: product.description ?? "",
    specs: {},
    images: primaryImageUrl
      ? [
          {
            id: "main",
            src: primaryImageUrl,
            alt: product.name,
          },
        ]
      : [],
  };
}

export default async function Home() {
  const featuredBackendProducts = await productService.listFeaturedProducts(8);
  const featuredProducts: CatalogProduct[] =
    featuredBackendProducts.map(mapBackendProductToCatalogProduct);

  return (
    <div className="space-y-10 pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-background px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 ts-gradient-border opacity-50" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)] lg:items-center">
          <div className="space-y-5">
            <p className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-accent ring-1 ring-(--accent)/40">
              New this week • RTX, OLED, 65% keyboards
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Build your next{" "}
              <span className="bg-linear-to-r from-[#00dfba] to-[#46488f] bg-clip-text text-transparent">
                dream setup
              </span>
              .
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-(--foreground-muted) sm:text-base">
              Curated laptops, components and peripherals for creators, gamers
              and builders. Hand-picked gear, transparent specs and fast
              shipping.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                href="/category/laptops"
                className="rounded-full bg-accent px-4 py-2 font-semibold text-background shadow-sm transition hover:opacity-90"
              >
                Shop laptops
              </Link>
              <Link
                href="/category/components"
                className="rounded-full border border-border-subtle bg-accent-soft px-4 py-2 font-medium text-foreground transition hover:bg-(--surface-hover)"
              >
                Browse components
              </Link>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-border-subtle bg-accent-soft p-4 sm:p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--foreground-muted)">
              Browse by category
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-[0.8rem]">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group rounded-2xl border border-border-subtle bg-background px-3 py-3 text-left transition hover:border-(--accent)/50 hover:bg-(--surface-hover)"
                >
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-(--foreground-muted)">
                    {category.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[0.7rem] text-(--foreground-muted) opacity-80">
                    {category.description}
                  </p>
                  <span className="mt-2 inline-flex text-[0.65rem] text-accent group-hover:opacity-90">
                    Shop now →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              Featured this week
            </h2>
            <p className="text-xs text-(--foreground-muted)">
              High-signal picks from our team of enthusiasts.
            </p>
          </div>
          <Link
            href="/search"
            className="text-xs font-medium text-accent hover:opacity-90"
          >
            View all products
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

