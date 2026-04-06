import type { Metadata } from "next";
import { productRepository } from "@/api/repository/product.repository";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import { ProductCard } from "@/features/catalog/components/product-card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Search",
  description: "Search across all TechnoStore products by name, brand or specs.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query } = await searchParams;
  
  // Fetch products from database
  // For now, show featured products if no query, or search by name if query provided
  let products;
  if (query) {
    // Simple search by name - in production would use MongoDB text search
    const allProducts = await productRepository.findFeatured(50);
    products = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
    );
  } else {
    products = await productRepository.findFeatured(20);
  }
  
  // Convert to presentation format
  const presentationProducts = products.map(toPresentationProduct);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Search
          </h1>
          <p className="text-xs text-(--foreground-muted)">
            Find laptops, components and peripherals across the full catalog.
          </p>
        </div>
        <form
          role="search"
          className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-accent-soft p-4 sm:flex-row sm:items-center"
        >
          <label
            htmlFor="query"
            className="text-xs font-medium text-(--foreground-muted) sm:w-32"
          >
            Search query
          </label>
          <Input
            id="query"
            name="q"
            defaultValue={query || ""}
            placeholder="Search by product name, brand or spec…"
            aria-label="Search products"
          />
        </form>
      </header>
      <section className="space-y-4">
        <p className="text-xs text-(--foreground-muted)">
          {query 
            ? `Showing ${presentationProducts.length} results for "${query}"`
            : `Showing ${presentationProducts.length} products`
          }
        </p>
        {presentationProducts.length === 0 ? (
          <div className="py-12 text-center text-sm text-(--foreground-muted)">
            {query 
              ? `No products found for "${query}". Try a different search term.`
              : "No products available."
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {presentationProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
