import { Skeleton } from "@/components/ui/skeleton";
import { clsx } from "clsx";

// Header skeleton - coincide con CategoryProductsClient header
function HeaderSkeleton() {
  return (
    <header className="space-y-2">
      <Skeleton className="h-7 w-48 sm:h-8 sm:w-64" />
      <Skeleton className="h-3 w-64 sm:h-4 sm:w-96" />
    </header>
  );
}

// Active filters skeleton (mobile)
function ActiveFiltersSkeleton() {
  return (
    <div className="space-y-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Skeleton className="h-7 w-20 shrink-0 rounded-full sm:h-8 sm:w-24" />
        <Skeleton className="h-7 w-20 shrink-0 rounded-full sm:h-8 sm:w-24" />
        <Skeleton className="h-7 w-20 shrink-0 rounded-full sm:h-8 sm:w-24" />
      </div>
    </div>
  );
}

// Toolbar skeleton - coincide con CategoryProductsClient toolbar
function ToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4">
      <Skeleton className="h-3 w-32 sm:h-4 sm:w-48" />
      <div className="hidden items-center gap-1 rounded-lg border border-[var(--border-subtle)] lg:flex">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

// Desktop sidebar filters skeleton — coincide con CategoryProductsClient
function SidebarFiltersSkeleton() {
  return (
    <div className="sticky top-32 space-y-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Price filter */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      
      {/* Brand filter */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-12" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Product card skeleton - coincide con PremiumProductCardV2
function ProductCardSkeleton() {
  return (
    <div className={clsx(
      "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3",
      "overflow-hidden"
    )}>
      {/* Image */}
      <Skeleton className="aspect-square w-full rounded-xl" />
      
      {/* Content */}
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        
        {/* Price row */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

// Products grid skeleton - matches CategoryProductsClient responsive grid
function ProductsGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="flex-1">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Pagination skeleton
function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-center gap-1 py-6 sm:py-8">
      <Skeleton className="h-8 w-14 rounded-md sm:h-9 sm:w-16" />
      <Skeleton className="h-8 w-8 rounded-md sm:h-9 sm:w-9" />
      <Skeleton className="h-8 w-8 rounded-md bg-[var(--accent)] sm:h-9 sm:w-9" />
      <Skeleton className="h-8 w-8 rounded-md sm:h-9 sm:w-9" />
      <Skeleton className="h-8 w-14 rounded-md sm:h-9 sm:w-16" />
    </div>
  );
}

// Mobile filter button skeleton
function FilterButtonSkeleton() {
  return (
    <div className="fixed bottom-6 right-4 z-40 lg:hidden">
      <Skeleton className="h-12 w-12 rounded-full shadow-lg" />
    </div>
  );
}

// Main skeleton completo - coincide exactamente con CategoryProductsClient
function CategoryPageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <HeaderSkeleton />
      
      {/* Active Filters (mobile only) */}
      <ActiveFiltersSkeleton />
      
      {/* Toolbar */}
      <ToolbarSkeleton />
      
      {/* Desktop Layout: Sidebar + Grid */}
      <div className="flex gap-8">
        {/* Desktop Sidebar — hidden w-64 shrink-0 lg:block igual que CategoryProductsClient */}
        <aside className="hidden w-64 shrink-0 space-y-6 lg:block">
          <SidebarFiltersSkeleton />
        </aside>
        
        {/* Products + Pagination */}
        <div className="flex-1 space-y-6">
          <ProductsGridSkeleton count={12} />
          <PaginationSkeleton />
        </div>
      </div>
      
      {/* Mobile Filter Button */}
      <FilterButtonSkeleton />
    </div>
  );
}

export default function CategoryLoading() {
  return <CategoryPageSkeleton />;
}