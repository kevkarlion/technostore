import Link from "next/link";
import type { Product as CatalogProduct } from "@/types/domain";
import { ProductCard } from "@/features/catalog/components/product-card";
import { productService } from "@/api/services/product.service";
import { categoryRepository } from "@/api/repository/category.repository";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import { PremiumHero } from "@/components/premium-hero";

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
      <PremiumHero
        badge="Productos de TechnoStore"
        title={
          <>
            Tu tienda de{" "}
            <span className="bg-linear-to-r from-[#00dfba] to-[#46488f] bg-clip-text text-transparent">
              tecnología
            </span>
            .
          </>
        }
        description="Memorias, discos, periféricos y más. Productos directamente importados de nuestro proveedor con los mejores precios."
        cta={{ href: "/search", label: "Ver todos los productos" }}
        rightContent={
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              Explorar por categoría
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-[0.8rem]">
              {categories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--background)] px-3 py-3 text-left transition hover:border-accent/50 hover:bg-[var(--surface-hover)]"
                >
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                    {category.name}
                  </p>
                  <span className="mt-2 inline-flex text-[0.65rem] text-accent group-hover:opacity-90">
                    Ver productos →
                  </span>
                </Link>
              ))}
            </div>
          </>
        }
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              Productos destacados
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
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

