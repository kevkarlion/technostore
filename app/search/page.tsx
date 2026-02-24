import type { Metadata } from "next";
import { products } from "@/lib/mock-data";
import { ProductCard } from "@/features/catalog/components/product-card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Search",
  description: "Search across all TechnoStore products by name, brand or specs.",
};

export default function SearchPage() {
  // Frontend-only demo search: in a real app this would be wired to an API
  const results = products;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Search
          </h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Find laptops, components and peripherals across the full catalog.
          </p>
        </div>
        <form
          role="search"
          className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center"
        >
          <label
            htmlFor="query"
            className="text-xs font-medium text-[var(--foreground-muted)] sm:w-32"
          >
            Search query
          </label>
          <Input
            id="query"
            name="q"
            placeholder="Search by product name, brand or spec…"
            aria-label="Search products"
          />
        </form>
      </header>
      <section className="space-y-4">
        <p className="text-xs text-[var(--foreground-muted)]">
          Showing {results.length} products
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

