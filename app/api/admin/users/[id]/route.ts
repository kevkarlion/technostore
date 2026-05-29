import { NextRequest, NextResponse } from "next/server";
import { adminUserRepository } from "@/api/repository/admin-user.repository";
import { verifyToken } from "@/lib/auth/jwt";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { badRequest, notFound, unauthorized } from "@/api/errors/http-error";

async function getAuthUser(req: NextRequest): Promise<{ userId: string; role: string }> {
  const token = req.cookies.get(AUTH_CONFIG.cookieName)?.value;
  if (!token) throw unauthorized();

  const payload = await verifyToken(token);
  if (!payload) throw unauthorized();

  return { userId: payload.userId ?? "", role: payload.role };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    const body = await req.json();
    const { name, email, role, status } = body;

    // Si se cambia el email, verificar que no esté duplicado
    if (email !== undefined) {
      if (typeof email !== "string" || !email.includes("@")) {
        return NextResponse.json(
          { message: "El email no es válido" },
          { status: 400 }
        );
      }
      const existingWithEmail = await adminUserRepository.findByEmail(email);
      if (existingWithEmail && existingWithEmail._id?.toString() !== id) {
        return NextResponse.json(
          { message: "Ya existe otro usuario con ese email" },
          { status: 409 }
        );
      }
    }

    // Autoprotección: no desactivarse a sí mismo ni cambiarse el rol propio
    if (id === authUser.userId) {
      if (status !== undefined) {
        return NextResponse.json(
          { message: "No podés desactivar tu propio usuario" },
          { status: 400 }
        );
      }
      if (role !== undefined) {
        return NextResponse.json(
          { message: "No podés cambiarte el rol a vos mismo" },
          { status: 400 }
        );
      }
    }

    // Solo un admin puede cambiar roles
    if (role !== undefined && authUser.role !== "admin" && authUser.role !== "superadmin") {
      return NextResponse.json(
        { message: "Solo un administrador puede cambiar roles" },
        { status: 403 }
      );
    }

    // Solo un admin puede cambiar status
    if (status !== undefined && authUser.role !== "admin" && authUser.role !== "superadmin") {
      return NextResponse.json(
        { message: "Solo un administrador puede cambiar el estado" },
        { status: 403 }
      );
    }

    const existing = await adminUserRepository.findById(id);
    if (!existing) throw notFound("Usuario no encontrado");

    const updated = await adminUserRepository.update(id, {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(status !== undefined && { status }),
    });

    if (!updated) throw notFound("Usuario no encontrado después de actualizar");

    const { passwordHash, ...publicUser } = updated;

    return NextResponse.json(
      { ...publicUser, _id: publicUser._id?.toString() },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const httpErr = error as { status: number; message: string };
      return NextResponse.json(
        { message: httpErr.message },
        { status: httpErr.status }
      );
    }
    console.error("[Admin Users API] Error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);

    // No eliminarse a sí mismo
    if (id === authUser.userId) {
      return NextResponse.json(
        { message: "No podés eliminar tu propio usuario" },
        { status: 400 }
      );
    }

    // Solo un admin puede eliminar
    if (authUser.role !== "admin" && authUser.role !== "superadmin") {
      return NextResponse.json(
        { message: "Solo un administrador puede eliminar usuarios" },
        { status: 403 }
      );
    }

    const existing = await adminUserRepository.findById(id);
    if (!existing) throw notFound("Usuario no encontrado");

    await adminUserRepository.delete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const httpErr = error as { status: number; message: string };
      return NextResponse.json(
        { message: httpErr.message },
        { status: httpErr.status }
      );
    }
    console.error("[Admin Users API] Error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
