import { NextRequest, NextResponse } from "next/server";
import { productController } from "@/api/controllers/product.controller";
import { productRepository } from "@/api/repository/product.repository";
import { toPresentationProduct } from "@/domain/mappers/product-to-presentation";
import { HttpError, internalServerError } from "@/api/errors/http-error";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  // Get exchange rate for price conversion (use venta for selling price)
  let exchangeRate: number | undefined;
  try {
    const res = await fetch(new URL("/api/exchange-rate", req.url).toString(), { 
      cache: "no-store" 
    });
    if (res.ok) {
      const data = await res.json();
      exchangeRate = data?.venta ?? undefined;  // Use venta (sell price) not compra
    }
  } catch (err) {
    console.error("[Products] Failed to get exchange rate:", err);
  }

  // Endpoint de búsqueda
  if (q) {
    try {
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const result = await productRepository.searchByName(q, { page, limit });
      const presentationProducts = result.items.map(p => toPresentationProduct(p, exchangeRate ?? undefined));
      return NextResponse.json({
        products: presentationProducts,
        total: result.total,
        page: result.page,
        limit: result.limit,
      }, { status: 200 });
    } catch (error) {
      return handleError(error);
    }
  }

  // Endpoint de productos destacados (sin query)
  if (req.url.includes("featured")) {
    try {
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const products = await productRepository.findFeatured(limit);
      const presentationProducts = products.map(p => toPresentationProduct(p, exchangeRate ?? undefined));
      return NextResponse.json({
        products: presentationProducts,
        total: products.length,
        page: 1,
        limit
      }, { status: 200 });
    } catch (error) {
      return handleError(error);
    }
  }

  // Default: list
  try {
    const result = await productController.list(req);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await productController.create(req);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { productRepository } = await import("@/api/repository/product.repository");
    const result = await productRepository.deleteAll();
    return NextResponse.json({ message: `Deleted ${result.deletedCount} products`, status: result.deletedCount }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { message: error.message, details: error.details },
      { status: error.status }
    );
  }

  const fallback = internalServerError();
  console.error("Unexpected error in /api/products:", error);
  return NextResponse.json(
    { message: fallback.message },
    { status: fallback.status }
  );
}

