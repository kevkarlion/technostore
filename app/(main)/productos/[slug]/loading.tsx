import { Skeleton } from "@/components/ui/skeleton";
import { clsx } from "clsx";

// Product detail page skeleton - coincide con PremiumGallery
function ProductDetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Main grid: 2 columnas */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-12">
        {/* LEFT COLUMN - Image Gallery */}
        <section className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white">
            <Skeleton className="absolute inset-0" />
          </div>
          
          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 flex-shrink-0 rounded-lg" />
            ))}
          </div>
        </section>

        {/* RIGHT COLUMN - Product Details */}
        <section className="space-y-4">
          {/* Glass container */}
          <div className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            {/* Header: Brand + Name */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-8 w-full" />
            </div>
            
            {/* Price & Rating box */}
            <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--background)]/50 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <Skeleton className="h-8 w-32" />
                <div className="space-y-1 text-right">
                  <Skeleton className="h-3 w-24 ml-auto" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
              </div>
              {/* Add to cart button */}
              <Skeleton className="h-12 w-full rounded-xl" />
              {/* Stock + shipping info */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Full-width: Description & Technical specs */}
      <div className="mx-auto mt-6 space-y-4 max-w-5xl">
        {/* Description */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        
        {/* Technical specs */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 px-2" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailLoading() {
  return <ProductDetailSkeleton />;
}