import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { verifyToken } from "@/lib/auth/jwt";

export type AdminAuth = {
  userId: string;
  role: "admin" | "superadmin";
};

export type AdminAuthResult =
  | { ok: true; auth: AdminAuth }
  | { ok: false; response: NextResponse };

/**
 * Require a valid administrator session for server-side user management.
 * Authentication failures return 401; authenticated non-admins return 403.
 */
export async function requireAdmin(req: NextRequest): Promise<AdminAuthResult> {
  const token = req.cookies.get(AUTH_CONFIG.cookieName)?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ message: "No autenticado" }, { status: 401 }),
    };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Token inválido" }, { status: 401 }),
    };
  }

  if (payload.role !== "admin" && payload.role !== "superadmin") {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Solo un administrador puede administrar usuarios" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    auth: {
      userId: payload.userId ?? "",
      role: payload.role,
    },
  };
}
