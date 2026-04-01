import Link from "next/link";
import type { Product as CatalogProduct } from "@/types/domain";
import { ProductCard } from "@/features/catalog/components/product-card";
import { productService } from "@/api/services/product.service";
import { categoryRepository } from "@/api/repository/category.repository";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";

export default async function Home() {
  // Fetch featured products from DB
  const featuredBackendProducts = await productService.listFeaturedProducts(8);
  const featuredProducts: CatalogProduct[] = featuredBackendProducts.map(
    toPresentationProduct
  );

  // Fetch categories from DB
  const categories = await categoryRepository.findAll();

  return (
    <div className="space-y-10 pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-background px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 ts-gradient-border opacity-50" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)] lg:items-center">
          <div className="space-y-5">
            <p className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-accent ring-1 ring-(--accent)/40">
              Productos de Cappelletti Informática
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Tu tienda de{" "}
              <span className="bg-linear-to-r from-[#00dfba] to-[#46488f] bg-clip-text text-transparent">
                tecnología
              </span>
              .
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-(--foreground-muted) sm:text-base">
              Memorias, discos, periféricos y más. Productos directly import from our supplier with the best prices.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                href="/search"
                className="rounded-full bg-accent px-4 py-2 font-semibold text-background shadow-sm transition hover:opacity-90"
              >
                Ver todos los productos
              </Link>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-border-subtle bg-accent-soft p-4 sm:p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--foreground-muted)">
              Explorar por categoría
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-[0.8rem]">
              {categories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group rounded-2xl border border-border-subtle bg-background px-3 py-3 text-left transition hover:border-(--accent)/50 hover:bg-(--surface-hover)"
                >
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-(--foreground-muted)">
                    {category.name}
                  </p>
                  <span className="mt-2 inline-flex text-[0.65rem] text-accent group-hover:opacity-90">
                    Ver productos →
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
              Productos destacados
            </h2>
            <p className="text-xs text-(--foreground-muted)">
              Los productos más populares de nuestro catálogo.
            </p>
          </div>
          <Link
            href="/search"
            className="text-xs font-medium text-accent hover:opacity-90"
          >
            Ver todos los productos
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

