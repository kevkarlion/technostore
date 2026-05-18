import { Skeleton } from "@/components/ui/skeleton";

// Search page skeleton - header static, solo skeleton en cards
function SearchPageSkeleton() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header static - sin skeleton */}
      <header className="space-y-4">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
            Buscar productos
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Encuentra laptops, componentes y periféricos en todo nuestro catálogo
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--border-subtle)]" />
            <div className="pl-12 pr-4 py-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] h-10" />
          </div>
        </div>
      </header>

      {/* Skeleton solo en las cards de resultados */}
      <section className="space-y-6">
        <Skeleton className="h-4 w-48" />
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function SearchLoading() {
  return <SearchPageSkeleton />;
}
