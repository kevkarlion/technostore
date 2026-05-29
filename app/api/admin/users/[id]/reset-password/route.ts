import { NextRequest, NextResponse } from "next/server";
import { adminUserRepository } from "@/api/repository/admin-user.repository";
import { verifyToken } from "@/lib/auth/jwt";
import { AUTH_CONFIG } from "@/lib/auth/config";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify auth
    const token = req.cookies.get(AUTH_CONFIG.cookieName)?.value;
    if (!token) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    // Solo un admin puede resetear contraseñas
    if (payload.role !== "admin" && payload.role !== "superadmin") {
      return NextResponse.json(
        { message: "Solo un administrador puede resetear contraseñas" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { message: "La nueva contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const user = await adminUserRepository.findById(id);
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    // Reset password (no verification of old password)
    const newHash = await adminUserRepository.hashPassword(newPassword);
    await adminUserRepository.update(id, { passwordHash: newHash });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Reset Password] Error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
