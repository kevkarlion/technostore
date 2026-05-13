import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAINTENANCE_TOKEN = process.env.MAINTENANCE_TOKEN || "preview";
const BYPASS_COOKIE = "maintenance-bypass";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Rutas que siempre permiten acceso
  const alwaysAllowed = [
    "/maintenance",
    "/api",
    "/_next",
    "/favicon.ico",
  ];

  // Verificar si es ruta exempted
  for (const path of alwaysAllowed) {
    if (pathname.startsWith(path)) {
      return NextResponse.next();
    }
  }

  // Verificar token en query string
  const token = searchParams.get(MAINTENANCE_TOKEN);

  // Verificar cookie de bypass
  const bypassCookie = request.cookies.get(BYPASS_COOKIE);

  // Si tiene token correcto o cookie, permitir acceso
  if (token === MAINTENANCE_TOKEN || bypassCookie?.value === "true") {
    // Si vino por token y no tiene cookie, setear cookie para persistencia
    if (token === MAINTENANCE_TOKEN && !bypassCookie) {
      const response = NextResponse.next();
      response.cookies.set(BYPASS_COOKIE, "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
      });
      return response;
    }
    return NextResponse.next();
  }

  // Redirigir a página de mantenimiento
  return NextResponse.redirect(new URL("/maintenance", request.url));
}

export const config = {
  matcher: [
    /*
     * Excluir paths con query params para que el matcher funcione bien
     */
    "/((?!maintenance|_next/static|_next/image|favicon.ico).*)",
  ],
};