import { Skeleton } from "@/components/ui/skeleton";

// Product detail page skeleton - matches product-gallery.tsx layout
function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Left column - Image gallery */}
      <section className="space-y-3">
        {/* Main image */}
        <Skeleton className="aspect-square w-full max-w-md rounded-2xl" />
        
        {/* Thumbnails */}
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-16 flex-shrink-0 rounded-lg" />
          ))}
        </div>
        
        {/* Technical specs */}
        <div className="rounded-2xl border border-border-subtle bg-background p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Description */}
        <div className="rounded-2xl border border-border-subtle bg-background p-4">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </div>
      </section>

      {/* Right column - Product details */}
      <section className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-3/4" />
        </div>
        
        <div className="rounded-2xl border border-border-subtle bg-background p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </section>
    </div>
  );
}

export default function ProductDetailLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ProductDetailSkeleton />
    </div>
  );
}