import { NextRequest, NextResponse } from "next/server";
import { productController } from "@/api/controllers/product.controller";
import { HttpError, notFound, internalServerError } from "@/api/errors/http-error";

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