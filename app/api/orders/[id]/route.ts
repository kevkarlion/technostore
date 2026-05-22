import { NextRequest, NextResponse } from "next/server";
import { orderController } from "@/api/controllers/order.controller";
import { HttpError, internalServerError } from "@/api/errors/http-error";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await orderController.getById(id);
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const order = await orderController.updateStatus(id, body);
    return NextResponse.json(order, { status: 200 });
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
  console.error("Unexpected error in /api/orders/[id]:", error);
  return NextResponse.json(
    { message: fallback.message },
    { status: fallback.status }
  );
}
