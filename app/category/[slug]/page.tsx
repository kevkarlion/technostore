import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryRepository } from "@/api/repository/category.repository";
import { productRepository } from "@/api/repository/product.repository";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import type { CategorySlug } from "@/types/domain";
import { ProductCard } from "@/features/catalog/components/product-card";

interface CategoryPageProps {
  params: Promise<{ slug: CategorySlug }>;
  searchParams: Promise<{ page?: string }>;
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

function PaginationControls({ 
  currentPage, 
  totalPages, 
  baseUrl 
}: { 
  currentPage: number; 
  totalPages: number; 
  baseUrl: string;
}) {
  if (totalPages <= 1) return null;
  
  const pages: (number | "...")[] = [];
  
  // Always show first page
  pages.push(1);
  
  // Add pages around current
  for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
    pages.push(i);
  }
  
  // Add ellipsis if needed
  if (currentPage > 3) pages.splice(1, 0, "...");
  
  // Add last page if needed
  if (totalPages > 1) pages.push(totalPages);
  
  return (
    <div className="flex items-center justify-center gap-1 py-8">
      {/* Previous button */}
      {currentPage > 1 && (
        <Link
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
        >
          ← Anterior
        </Link>
      )}
      
      {/* Page numbers */}
      {pages.map((page, idx) => (
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-[var(--foreground-muted)]">...</span>
        ) : (
          <Link
            key={page}
            href={`${baseUrl}?page=${page}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              page === currentPage
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border-subtle)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {page}
          </Link>
        )
      ))}
      
      {/* Next button */}
      {currentPage < totalPages && (
        <Link
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
        >
          Siguiente →
        </Link>
      )}
    </div>
  );
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  
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
                href={`/category/${slug}/${sub.slug}`}
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

  // Otherwise, show products (subcategory page) with pagination
  const result = await productRepository.findByCategorySlugPaginated(
    category.slug,
    currentPage,
    PRODUCTS_PER_PAGE
  );
  
  // Convert database products to presentation format for UI components
  const products = result.items.map(toPresentationProduct);

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
      
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span>Mostrando {products.length} de {result.total} productos</span>
        </div>
        
        {products.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--foreground-muted)]">
            No products found in this category.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <PaginationControls 
              currentPage={result.page} 
              totalPages={result.totalPages} 
              baseUrl={`/category/${slug}`}
            />
          </>
        )}
      </section>
    </div>
  );
}