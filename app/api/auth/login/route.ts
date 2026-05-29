import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG, validateAuthConfig } from "@/lib/auth/config";
import { signToken } from "@/lib/auth/jwt";
import { adminUserRepository } from "@/api/repository/admin-user.repository";

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

    // — 1. Try database admin user —
    const dbUser = await adminUserRepository.findByEmail(email);

    if (dbUser) {
      // Check if user is active
      if (dbUser.status !== "active") {
        return NextResponse.json(
          { error: "Usuario desactivado. Contactá al administrador." },
          { status: 403 }
        );
      }

      // Verify password against hash
      const passwordMatch = await adminUserRepository.comparePassword(
        password,
        dbUser.passwordHash
      );

      if (passwordMatch) {
        const userId = dbUser._id?.toString();
        const token = await signToken({
          email: dbUser.email,
          role: dbUser.role,
          userId,
          name: dbUser.name,
        });

        const response = NextResponse.json({
          success: true,
          name: dbUser.name,
          role: dbUser.role,
          userId,
        });

        response.cookies.set(AUTH_CONFIG.cookieName, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24, // 24 h
          path: "/",
        });

        return response;
      }

      // Password didn't match DB user
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // — 2. Fallback: legacy env var admin (admin por defecto) —
    if (email === AUTH_CONFIG.adminEmail && password === AUTH_CONFIG.adminPassword) {
      const token = await signToken({ email, role: "admin", name: email });

      const response = NextResponse.json({
        success: true,
        name: email,
        role: "admin",
      });

      response.cookies.set(AUTH_CONFIG.cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 h
        path: "/",
      });

      return response;
    }

    // — 3. No match —
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  } catch (err) {
    console.error("[Auth] Login error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
