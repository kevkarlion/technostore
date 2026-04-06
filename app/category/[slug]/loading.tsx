import { Skeleton } from "@/components/ui/skeleton";

// Category page skeleton - matches the layout in app/category/[slug]/page.tsx
function CategoryPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Category header */}
      <header className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </header>

      {/* Subcategories (if any) */}
      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </section>

      {/* Products grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
    </div>
  );
}

// If there's no specific loading for category, use this as default
export default function CategoryLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CategoryPageSkeleton />
    </div>
  );
}