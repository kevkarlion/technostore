import { Cpu, CircuitBoard, Database, Monitor, Zap, Box } from "lucide-react";

const SKELETON_CATEGORIES = [
  { slug: "cpu", name: "Procesadores (CPU)", Icon: Cpu },
  { slug: "motherboard", name: "Motherboards", Icon: CircuitBoard },
  { slug: "ram", name: "Memorias RAM", Icon: Database },
  { slug: "gpu", name: "Placas de Video", Icon: Monitor },
  { slug: "psu", name: "Fuentes de Poder", Icon: Zap },
  { slug: "case", name: "Gabinetes", Icon: Box },
  { slug: "storage", name: "Almacenamiento", Icon: Database },
];

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-700 ${className ?? ""}`}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-3">
      {/* Imagen */}
      <SkeletonPulse className="mb-3 aspect-square w-full rounded-lg" />
      {/* Título */}
      <SkeletonPulse className="mb-2 h-4 w-3/4" />
      {/* Descripción */}
      <SkeletonPulse className="mb-3 h-3 w-full" />
      {/* Precio y botón */}
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-5 w-20" />
        <SkeletonPulse className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export default function ArmaTuPcLoading() {
  return (
    <div>
      {/* ───── Hero — siempre visible ───── */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-gray-900 to-purple-950 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Armá tu PC ideal
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-300 sm:text-lg">
            Elegí cada componente para armar la PC que siempre quisiste.
            Todo en un solo lugar, con los mejores precios.
          </p>

          {/* Search bar skeleton — evita salto al montar el cliente */}
          <div className="mt-6 max-w-md">
            <div className="h-10 w-full animate-pulse rounded-lg bg-white/10" />
          </div>
        </div>
      </section>

      {/* ── Contenedor principal ── */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_1fr]">
          {/* Sidebar skeleton */}
          <aside className="hidden self-start lg:block lg:sticky lg:top-36">
            <nav className="rounded-xl border border-gray-700 bg-gray-900 p-3">
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Componentes
              </div>
              <div className="space-y-0.5">
                {SKELETON_CATEGORIES.map(({ Icon, name }) => (
                  <div
                    key={name}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-600" />
                    <span className="truncate text-gray-500">
                      {name}
                    </span>
                    <SkeletonPulse className="ml-auto h-3 w-5" />
                  </div>
                ))}
              </div>
            </nav>
          </aside>

          {/* Cards skeleton */}
          <main className="min-w-0">
            {/* Mobile category pills skeleton */}
            <div className="mb-6 -mx-4 overflow-x-auto px-4 scrollbar-hide lg:hidden">
              <div className="flex gap-2">
                {SKELETON_CATEGORIES.slice(0, 3).map(({ name }) => (
                  <div
                    key={name}
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs"
                  >
                    <SkeletonPulse className="h-3 w-3" />
                    <SkeletonPulse className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Category sections with card skeletons */}
            <div className="space-y-10 sm:space-y-12">
              {[1, 2, 3, 4].map((sectionIdx) => (
                <div key={sectionIdx}>
                  {/* Category header */}
                  <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <SkeletonPulse className="h-6 w-44" />
                    <SkeletonPulse className="h-4 w-20" />
                  </div>

                  {/* Card grid */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((cardIdx) => (
                      <CardSkeleton key={cardIdx} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
