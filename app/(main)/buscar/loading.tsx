import { Skeleton } from "@/components/ui/skeleton";
import { clsx } from "clsx";

// Search page skeleton - coincide con search-client.tsx
function SearchPageSkeleton() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header static - mismo layout que la página real */}
      <header className="space-y-4">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
            Buscar productos
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Encuentra laptops, componentes y periféricos en todo nuestro catálogo
          </p>
        </div>
        {/* Search bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--border-subtle)]" />
            <div className="pl-12 pr-4 py-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] h-10" />
          </div>
        </div>
      </header>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Products grid - coincide con PremiumProductCardV2 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 overflow-hidden">
            {/* Image */}
            <div className="relative aspect-square overflow-hidden rounded-xl bg-white/[0.03]">
              <div className="h-full w-full animate-pulse bg-white/[0.03]" />
            </div>
            
            {/* Content */}
            <div className="mt-3 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-6 w-24 animate-pulse rounded bg-white/[0.06]" />
              <div className="flex items-center gap-1">
                <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-3 w-12 animate-pulse rounded bg-white/[0.06]" />
              </div>
              <div className="h-10 w-full animate-pulse rounded-lg bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-center gap-1 py-8">
        <Skeleton className="h-9 w-16 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-16 rounded-md" />
      </div>
    </div>
  );
}

export default function SearchLoading() {
  return <SearchPageSkeleton />;
}