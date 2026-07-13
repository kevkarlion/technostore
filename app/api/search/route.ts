import { NextRequest, NextResponse } from "next/server";
import { searchEngine } from "@/lib/search/search-engine";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json(
      { products: [], total: 0, page: 1, limit: 20, searchMeta: null },
      { status: 200 }
    );
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const category = searchParams.get("category") || undefined;

  let exchangeRate: number | undefined;
  try {
    const res = await fetch(new URL("/api/exchange-rate", req.url).toString(), {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      exchangeRate = data?.venta ?? undefined;
    }
  } catch {
    // Exchange rate is optional — search still works without it
  }

  try {
    const result = await searchEngine.search(q, {
      page,
      limit,
      categoryHint: category,
    });

    const products = result.items.map((s) =>
      toPresentationProduct(s.product, exchangeRate ?? undefined)
    );

    return NextResponse.json(
      {
        products,
        total: result.total,
        page: result.page,
        limit: result.limit,
        searchMeta: result.searchMeta ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Search] Error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
