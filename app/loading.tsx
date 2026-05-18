import { Skeleton } from "@/components/ui/skeleton";

// Header skeleton (coincide con el header de página)
function HeaderSkeleton() {
  return (
    <section className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-1 w-1 rounded-full" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-1 w-1 rounded-full" />
        <Skeleton className="h-5 w-28" />
      </div>
    </section>
  );
}

// Hero Carousel skeleton (coincide con HeroWrapper)
function HeroCarouselSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl aspect-[3/4] sm:aspect-[4/3] md:aspect-[5/2]">
      <Skeleton className="absolute inset-0" />
    </div>
  );
}

// Featured products skeleton (coincide con PremiumFeaturedProducts)
function ProductsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-6 w-24" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RootLoading() {
  return (
    <div className="space-y-20 pb-4 px-4 sm:px-6 lg:px-8">
      <HeaderSkeleton />
      <HeroCarouselSkeleton />
      <ProductsGridSkeleton count={8} />
    </div>
  );
}