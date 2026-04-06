import { Skeleton } from "@/components/ui/skeleton";

// Hero section skeleton (matches the banner in page.tsx)
function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-background px-6 py-10 sm:px-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)] lg:items-center">
        <div className="space-y-5">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4 rounded-3xl border border-border-subtle bg-accent-soft p-4 sm:p-5">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Featured products skeleton (matches the product grid)
function ProductsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border-subtle bg-background p-3">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16" />
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
    <div className="space-y-10 pb-4">
      <HeroSkeleton />
      <ProductsGridSkeleton count={4} />
    </div>
  );
}