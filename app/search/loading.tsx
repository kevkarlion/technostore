import { Skeleton } from "@/components/ui/skeleton";

// Search page skeleton - matches search/page.tsx layout
function SearchPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
        {/* Search form */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-accent-soft p-4 sm:flex-row sm:items-center">
          <Skeleton className="h-4 w-24 sm:w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </header>

      {/* Results count */}
      <section className="space-y-4">
        <Skeleton className="h-4 w-48" />

        {/* Products grid */}
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

export default function SearchLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <SearchPageSkeleton />
    </div>
  );
}
