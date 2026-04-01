import { NextRequest, NextResponse } from "next/server";
import { productController } from "@/api/controllers/product.controller";
import { HttpError, internalServerError } from "@/api/errors/http-error";

export async function GET(req: NextRequest) {
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

