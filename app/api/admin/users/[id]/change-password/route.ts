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

    // Solo el propio usuario puede cambiar su contraseña
    if (payload.userId !== id) {
      return NextResponse.json(
        { message: "Solo podés cambiar tu propia contraseña" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { message: "La contraseña actual es requerida" },
        { status: 400 }
      );
    }
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

    // Verify current password
    const isValid = await adminUserRepository.comparePassword(
      currentPassword,
      user.passwordHash
    );

    if (!isValid) {
      return NextResponse.json(
        { message: "La contraseña actual no es correcta" },
        { status: 401 }
      );
    }

    // Update password
    const newHash = await adminUserRepository.hashPassword(newPassword);
    await adminUserRepository.update(id, { passwordHash: newHash });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Change Password] Error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
