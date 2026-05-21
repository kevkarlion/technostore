import { Skeleton } from "@/components/ui/skeleton";
import { clsx } from "clsx";

// ============================================================================
// ROOT PAGE SKELETONS - coinciden con app/page.tsx
// ============================================================================

// Header skeleton - coincide con la sección h1 del home
function HeaderSkeleton() {
  return (
    <section className="space-y-3 pt-8">
      <Skeleton className="h-10 w-64 sm:h-14 sm:w-80" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-1 w-1 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-1 w-1 rounded-full" />
        <Skeleton className="h-5 w-28" />
      </div>
    </section>
  );
}

// Hero carousel skeleton
function HeroCarouselSkeleton() {
  return (
    <section className="pt-10">
      <div className="relative overflow-hidden rounded-xl aspect-[3/4] sm:aspect-[4/3] md:aspect-[5/2]">
        <Skeleton className="absolute inset-0" />
      </div>
    </section>
  );
}

// Service differentials skeleton - "¿Por Qué Elegirnos?"
function ServiceDifferentialsSkeleton() {
  return (
    <section className="py-16">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        
        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900/80 via-zinc-800/50 to-zinc-900/80 p-5">
              <div className="flex flex-col items-center text-center space-y-3">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Category showcase skeleton
function CategoryShowcaseSkeleton() {
  return (
    <section className="py-16">
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

// Featured products skeleton - coincide con PremiumFeaturedProducts
function FeaturedProductsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <section className="py-16">
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="w-[160px] sm:w-[200px] shrink-0">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Trust badges skeleton - "Pensado para una mejor experiencia"
function TrustBadgesSkeleton() {
  return (
    <section className="py-16">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-80 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        
        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900/80 via-zinc-800/50 to-zinc-900/80 p-5">
              <div className="flex flex-col items-center text-center space-y-3">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact location skeleton
function ContactLocationSkeleton() {
  return (
    <section className="py-16">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-2xl" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

// CTA skeleton
function CTASkeleton() {
  return (
    <section className="py-16">
      <div className="flex justify-center">
        <Skeleton className="h-16 w-64 rounded-xl" />
      </div>
    </section>
  );
}

// Main loading component - coincide con page.tsx
export default function RootLoading() {
  return (
    <div className="pb-4 px-4 sm:px-6 lg:px-8">
      <HeaderSkeleton />
      <HeroCarouselSkeleton />
      <ServiceDifferentialsSkeleton />
      <CategoryShowcaseSkeleton />
      <FeaturedProductsSkeleton count={8} />
      <TrustBadgesSkeleton />
      <ContactLocationSkeleton />
      <CTASkeleton />
    </div>
  );
}