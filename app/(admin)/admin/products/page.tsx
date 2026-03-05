import Link from "next/link";
import { productService } from "@/api/services/product.service";

export default async function AdminProductsPage() {
  const data = await productService.listProducts({
    page: 1,
    limit: 20,
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Products</h1>
          <p className="text-xs text-slate-400">
            Simple example list using the service layer.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950"
        >
          New product
        </Link>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Price</th>
            </tr>
          </thead>

          <tbody>
            {data.items.map((product) => (
              <tr key={product.id} className="border-b border-slate-900/60">
                <td className="px-4 py-2 text-slate-100">
                  {product.name}
                </td>

                <td className="px-4 py-2 text-slate-200">
                  {product.price.toFixed(2)} {product.currency}
                </td>
              </tr>
            ))}

            {data.items.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-500"
                  colSpan={2}
                >
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}