import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { productController } from "@/api/controllers/product.controller";
import { productMapper } from "@/domain/mappers/product.mapper";
import { HttpError, notFound, internalServerError } from "@/api/errors/http-error";
import { generateProductSlug } from "@/domain/mappers/product-to-presentation";
import { productRepository } from "@/api/repository/product.repository";
import { productService } from "@/api/services/product.service";
import { requireAdmin } from "@/lib/auth/admin-authorization";

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
    
    // Admin always works in USD — no exchange rate conversion
    const result = productMapper.toResponse(product);
    
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

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authorization = await requireAdmin(req);
  if (!authorization.ok) return authorization.response;

  try {
    const { id } = await params;

    let product;
    try {
      product = await productRepository.findById(id);
    } catch {
      throw notFound("Product not found");
    }

    if (!product) {
      throw notFound("Product not found");
    }

    await productService.deleteProduct(id);

    if (product.slug) {
      revalidatePath(`/productos/${product.slug}`);
    }
    for (const categorySlug of new Set(product.categories ?? [])) {
      revalidatePath(`/categorias/${categorySlug}`);
    }
    revalidatePath("/categorias");
    revalidatePath("/");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message, details: error.details },
        { status: error.status }
      );
    }

    const fallback = internalServerError();
    console.error("Unexpected error in DELETE /api/products/[id]:", error);
    return NextResponse.json(
      { message: fallback.message },
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