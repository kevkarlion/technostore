import { Skeleton } from "@/components/ui/skeleton";

// Product detail page skeleton - matches product-gallery.tsx layout
function ProductDetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid max-w-5xl mx-auto grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-12">
        {/* Left column - Image gallery */}
        <section className="space-y-3">
          {/* Main image */}
          <Skeleton className="aspect-square w-full rounded-2xl" />
          
          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 flex-shrink-0 rounded-lg" />
            ))}
          </div>
        </section>

        {/* Right column - Product details */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-3/4" />
          </div>
          
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 space-y-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-12 w-full" />
          </div>
        </section>
      </div>

      {/* Full-width: Description & Technical specs */}
      <div className="max-w-5xl mx-auto mt-6">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function ProductDetailLoading() {
  return <ProductDetailSkeleton />;
}