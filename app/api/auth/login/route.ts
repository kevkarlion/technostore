import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG, validateAuthConfig } from "@/lib/auth/config";
import { signToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  // Validate config at request time so missing env vars fail fast
  const missing = validateAuthConfig();
  if (missing.length > 0) {
    console.error("[Auth] Missing env vars:", missing.join(", "));
    return NextResponse.json(
      { error: "Error de configuración del servidor" },
      { status: 500 }
    );
  }

  try {
    const { email, password } = await req.json();

    // — Validations —
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "La contraseña es requerida" },
        { status: 400 }
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "El email no es válido" },
        { status: 400 }
      );
    }

    // — Credential check —
    if (email !== AUTH_CONFIG.adminEmail || password !== AUTH_CONFIG.adminPassword) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // — Issue token —
    const token = await signToken({ email, role: "admin" });

    const response = NextResponse.json({ success: true });

    // httpOnly cookie — not accessible from JS, protects against XSS
    response.cookies.set(AUTH_CONFIG.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 h
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[Auth] Login error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
