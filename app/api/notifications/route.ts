import { NextRequest, NextResponse } from "next/server";
import { notificationRepository } from "@/api/repository/notification.repository";

/**
 * GET /api/notifications — poll for unread notifications
 * Used by the admin panel to detect new orders in real time.
 *
 * Query params:
 *   ?test=1 — creates a test notification (for debugging)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const isTest = url.searchParams.get("test") === "1";

    console.log("[Notifications API] GET /api/notifications called" + (isTest ? " (with test=1)" : ""));

    // If test=1, create a test notification to verify the full flow
    if (isTest) {
      const testData = {
        type: "new_order" as const,
        title: "🔔 PRUEBA — Notificación de depuración",
        message: `Test — ${new Date().toLocaleString("es-AR")}`,
        orderId: `test-${Date.now()}`,
        orderRef: `TEST-${Date.now().toString(36).toUpperCase()}`,
      };
      console.log("[Notifications API] Creating test notification:", JSON.stringify(testData));
      await notificationRepository.create(testData);
      console.log("[Notifications API] Test notification created");
    }

    const notifications = await notificationRepository.getUnread();
    console.log(`[Notifications API] Returning ${notifications.length} notifications`);
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
