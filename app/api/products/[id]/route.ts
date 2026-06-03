import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { productController } from "@/api/controllers/product.controller";
import { HttpError, notFound, internalServerError } from "@/api/errors/http-error";
import { generateProductSlug } from "@/domain/mappers/product-to-presentation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await productController.getById(req, id);
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