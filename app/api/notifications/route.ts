import { NextRequest, NextResponse } from "next/server";
import { notificationRepository } from "@/api/repository/notification.repository";

/**
 * GET /api/notifications — poll for unread notifications
 * Used by the admin panel to detect new orders in real time.
 */
export async function GET() {
  try {
    const notifications = await notificationRepository.getUnread();
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("[Notifications API] GET error:", error);
    return NextResponse.json(
      { message: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications — mark one or all notifications as read
 * Body: { id: string } marks one, { all: true } marks all
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.all === true) {
      await notificationRepository.markAllRead();
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await notificationRepository.markRead(body.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { message: "Se requiere id o all: true" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Notifications API] PATCH error:", error);
    return NextResponse.json(
      { message: "Error al actualizar notificaciones" },
      { status: 500 }
    );
  }
}
