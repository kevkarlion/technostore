import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryRepository } from "@/api/repository/category.repository";
import { productRepository } from "@/api/repository/product.repository";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import type { CategorySlug } from "@/types/domain";
import { ProductCard } from "@/features/catalog/components/product-card";

interface CategoryPageProps {
  params: Promise<{ slug: CategorySlug }>;
}

export async function generateStaticParams() {
  const categories = await categoryRepository.findAll();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await categoryRepository.findBySlug(slug);
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
  const category = await categoryRepository.findBySlug(slug);
  if (!category) return notFound();

  const dbProducts = await productRepository.findByCategorySlug(category.slug);
  
  // Convert database products to presentation format for UI components
  const products = dbProducts.map(toPresentationProduct);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-xl text-xs text-(--foreground-muted)">
            {category.description}
          </p>
        )}
      </header>
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-(--foreground-muted)">
          <span>{products.length} products</span>
        </div>
        {products.length === 0 ? (
          <div className="py-12 text-center text-sm text-(--foreground-muted)">
            No products found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
