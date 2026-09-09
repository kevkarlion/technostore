export function AnnouncementBar() {
  return (
    <div className="bg-[var(--accent-purple)]">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] font-medium text-white sm:text-xs">
          Compras antes de las 12 h: disponible en el local después de las 18 h{" "}
          <span className="hidden sm:inline">·</span>
          <br className="sm:hidden" />{" "}
          Compras después de las 12 h: disponible al día siguiente después de las 18 h.
        </p>
      </div>
    </div>
  );
}
