import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MAINTENANCE_TOKEN = process.env.MAINTENANCE_TOKEN || "preview";
const BYPASS_COOKIE = "maintenance-bypass";
const JWT_SECRET = process.env.JWT_SECRET || "";
const AUTH_COOKIE = "admin-token";

const getSecret = () => new TextEncoder().encode(JWT_SECRET);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── 1. Category redirect (migración) ──────────────────────────────────
  if (pathname.startsWith("/category/")) {
    const dest = new URL(request.url);
    dest.pathname = pathname.replace(/^\/category/, "/categorias");
    return NextResponse.redirect(dest, { status: 308 });
  }

  // ── 2. Paths that always bypass maintenance & auth ─────────────────────
  const alwaysAllowed = [
    "/maintenance",
    "/api",
    "/_next",
    "/favicon.ico",
    "/admin/login",
  ];

  for (const path of alwaysAllowed) {
    if (pathname.startsWith(path)) {
      return NextResponse.next();
    }
  }

  // ── 3. Maintenance mode check ─────────────────────────────────────────
  const bypassToken = searchParams.get(MAINTENANCE_TOKEN);
  const bypassCookie = request.cookies.get(BYPASS_COOKIE);
  const isMaintenanceBypassed =
    bypassToken === MAINTENANCE_TOKEN || bypassCookie?.value === "true";

  if (!isMaintenanceBypassed) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // Set maintenance cookie when coming from ?preview=preview
  if (bypassToken === MAINTENANCE_TOKEN && !bypassCookie) {
    const response = NextResponse.next();
    response.cookies.set(BYPASS_COOKIE, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  }

  // ── 4. Admin auth check ───────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!JWT_SECRET) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - maintenance (to avoid redirect loops)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!maintenance|_next/static|_next/image|favicon.ico).*)",
  ],
};
