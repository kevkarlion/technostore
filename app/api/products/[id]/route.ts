import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { productController } from "@/api/controllers/product.controller";
import { productMapper } from "@/domain/mappers/product.mapper";
import { HttpError, notFound, internalServerError } from "@/api/errors/http-error";
import { generateProductSlug } from "@/domain/mappers/product-to-presentation";
import { productRepository } from "@/api/repository/product.repository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Try to find by ID first, then by slug
    let product;
    try {
      // Try as MongoDB ObjectId
      product = await productRepository.findById(id);
    } catch {
      // If that fails, try as slug
      product = await productRepository.findBySlug(id);
    }
    
    if (!product) {
      throw notFound("Product not found");
    }
    
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
    
    const result = productMapper.toResponse(product, exchangeRate);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message, details: error.details },
        { status: error.status }
      );
    }

    const fallback = internalServerError();
    console.error("Unexpected error in /api/products/[id]:", error);
    return NextResponse.json(
      { message: fallback.message, error: String(error) },
      { status: fallback.status }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    const result = await productController.update(req, id, body);

    // Invalidate cache for product detail page and categories
    if (result && result.name) {
      const slug = generateProductSlug(result.name);
      revalidatePath(`/productos/${slug}`);
      revalidatePath(`/categorias`);
      revalidatePath("/");
      console.log(`[Revalidate] Cache invalidated for /productos/${slug}`);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message, details: error.details },
        { status: error.status }
      );
    }

    const fallback = internalServerError();
    console.error("Unexpected error in PATCH /api/products/[id]:", error);
    return NextResponse.json(
      { message: fallback.message },
      { status: fallback.status }
    );
  }
}