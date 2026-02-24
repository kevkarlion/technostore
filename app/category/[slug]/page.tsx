import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, getProductsByCategorySlug } from "@/lib/mock-data";
import type { CategorySlug } from "@/types/domain";
import { ProductCard } from "@/features/catalog/components/product-card";

interface CategoryPageProps {
  params: Promise<{ slug: CategorySlug }>;
}

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return {
      title: "Category not found",
    };
  }

  return {
    title: category.name,
    description:
      category.description ??
      `Browse ${category.name.toLowerCase()} at TechnoStore.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return notFound();

  const products = getProductsByCategorySlug(category.slug);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-xl text-xs text-[var(--foreground-muted)]">
            {category.description}
          </p>
        )}
      </header>
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span>{products.length} products</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

