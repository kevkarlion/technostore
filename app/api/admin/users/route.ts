import { NextRequest, NextResponse } from "next/server";
import { adminUserRepository } from "@/api/repository/admin-user.repository";
import { HttpError, badRequest, internalServerError } from "@/api/errors/http-error";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
    const search = url.searchParams.get("search") ?? undefined;

    const result = await adminUserRepository.findPaginated({ page, limit, search });

    // Strip passwordHash from response
    const items = result.items.map(({ passwordHash, ...rest }) => ({
      ...rest,
      _id: rest._id?.toString(),
    }));

    return NextResponse.json({ ...result, items }, { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message, details: error.details },
        { status: error.status }
      );
    }
    console.error("[Admin Users API] Error:", error);
    const fallback = internalServerError();
    return NextResponse.json(
      { message: fallback.message },
      { status: fallback.status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    // Validations
    if (!email || typeof email !== "string") {
      throw badRequest("El email es requerido");
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      throw badRequest("La contraseña debe tener al menos 6 caracteres");
    }
    if (!name || typeof name !== "string") {
      throw badRequest("El nombre es requerido");
    }
    if (!email.includes("@")) {
      throw badRequest("El email no es válido");
    }

    // Check for duplicate email
    const existing = await adminUserRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { message: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    const user = await adminUserRepository.create({
      email,
      password,
      name,
      role: role === "admin" ? "admin" : "user",
    });

    const { passwordHash, ...publicUser } = user;

    return NextResponse.json(
      { ...publicUser, _id: publicUser._id?.toString() },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message, details: error.details },
        { status: error.status }
      );
    }
    console.error("[Admin Users API] Error:", error);
    const fallback = internalServerError();
    return NextResponse.json(
      { message: fallback.message },
      { status: fallback.status }
    );
  }
}
