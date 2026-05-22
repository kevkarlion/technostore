import { NextRequest, NextResponse } from "next/server";
import { customerRepository } from "@/api/repository/customer.repository";
import { HttpError, internalServerError, badRequest } from "@/api/errors/http-error";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
    const search = url.searchParams.get("search") ?? undefined;

    const result = await customerRepository.findPaginated({ page, limit, search });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message, details: error.details },
        { status: error.status }
      );
    }
    console.error("[Customers API] Error:", error);
    const fallback = internalServerError();
    return NextResponse.json(
      { message: fallback.message },
      { status: fallback.status }
    );
  }
}
