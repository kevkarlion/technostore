import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Layout muy básico de ejemplo; se puede extender con sidebar/topbar.
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-2 text-sm text-slate-300">
            <div className="font-semibold text-slate-100">Admin</div>
            <a href="/admin" className="block rounded px-2 py-1 hover:bg-slate-900">
              Dashboard
            </a>
            <a
              href="/admin/products"
              className="block rounded px-2 py-1 hover:bg-slate-900"
            >
              Products
            </a>
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

