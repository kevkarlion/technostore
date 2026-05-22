import { NextRequest, NextResponse } from "next/server";
import { orderController } from "@/api/controllers/order.controller";
import { HttpError, internalServerError } from "@/api/errors/http-error";

export async function GET(req: NextRequest) {
  try {
    const result = await orderController.list(req);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const order = await orderController.create(req);
    return NextResponse.json(order, { status: 201 });
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
  console.error("Unexpected error in /api/orders:", error);
  return NextResponse.json(
    { message: fallback.message },
    { status: fallback.status }
  );
}
