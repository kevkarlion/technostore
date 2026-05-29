import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { AUTH_CONFIG } from "@/lib/auth/config";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_CONFIG.cookieName)?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    email: payload.email,
    name: payload.name ?? "Admin",
    role: payload.role,
    userId: payload.userId ?? null,
  });
}
