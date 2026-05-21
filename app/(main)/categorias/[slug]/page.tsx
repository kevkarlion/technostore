import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryRepository } from "@/api/repository/category.repository";
import { productRepository } from "@/api/repository/product.repository";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import type { CategorySlug } from "@/types/domain";
import { PremiumProductCardV2 } from "@/components/product-card/premium-product-card-v2";
import { CategoryProductsClient } from "./category-products-client";

interface CategoryPageProps {
  params: Promise<{ slug: CategorySlug }>;
  searchParams: Promise<{ 
    page?: string;
    priceMin?: string;
    priceMax?: string;
    brands?: string;
  }>;
}

const PRODUCTS_PER_PAGE = 20;

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

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page, priceMin, priceMax, brands } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  
  // Parse filters
  const filters = {
    priceMin: priceMin ? parseInt(priceMin, 10) : undefined,
    priceMax: priceMax ? parseInt(priceMax, 10) : undefined,
    brands: brands ? brands.split(",").filter(Boolean) : undefined,
  };
  
  const category = await categoryRepository.findBySlug(slug);
  if (!category) return notFound();

  // Get all categories to find subcategories of this parent
  const allCategories = await categoryRepository.findAll();
  const subcategories = allCategories.filter(
    (cat) => cat.parentId === slug
  );

  // If this is a parent category with subcategories, show subcategory links
  if (subcategories.length > 0) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {category.name}
          </h1>
          {category.description && (
            <p className="max-w-xl text-xs text-[var(--foreground-muted)]">
              {category.description}
            </p>
          )}
        </header>

        {/* Subcategory grid */}
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categorias/${sub.slug}`}
                className="group flex flex-col items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-4 text-center transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
              >
                <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)]">
                  {sub.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Get filter metadata (price range and brands)
  const [priceRange, availableBrands] = await Promise.all([
    productRepository.getPriceRangeByCategory(category.slug),
    productRepository.getBrandsByCategory(category.slug),
  ]);

  // If no filters, use regular pagination, otherwise use filtered query
  let result;
  if (filters.priceMin || filters.priceMax || (filters.brands && filters.brands.length > 0)) {
    result = await productRepository.findByCategorySlugFiltered(
      category.slug,
      currentPage,
      PRODUCTS_PER_PAGE,
      { priceMin: filters.priceMin, priceMax: filters.priceMax, brands: filters.brands }
    );
  } else {
    result = await productRepository.findByCategorySlugPaginated(
      category.slug,
      currentPage,
      PRODUCTS_PER_PAGE
    );
  }
  
  // Convert database products to presentation format for UI components
  const products = result.items.map(toPresentationProduct);

  return (
    <CategoryProductsClient
      category={category}
      products={products}
      result={result}
      currentPage={currentPage}
      baseUrl={`/categorias/${slug}`}
      categorySlug={slug}
      priceRange={priceRange}
      brands={availableBrands}
      filters={{
        priceMin: filters.priceMin || priceRange.min,
        priceMax: filters.priceMax || priceRange.max,
        brands: filters.brands || [],
      }}
    />
  );
}