import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="space-y-6 pb-4">
      <section className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
          <div className="space-y-4">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

