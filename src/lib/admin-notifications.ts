import { notificationRepository } from "@/api/repository/notification.repository";
import type { Order } from "@/domain/models/order";

/**
 * Create a "new order" notification when a customer completes a purchase.
 * Called from orderService.createOrder when a new order is first persisted.
 */
export async function notifyNewOrder(order: Order): Promise<void> {
  try {
    const orderId = order._id?.toString();
    console.log(`[Notifications] notifyNewOrder: orderId=${orderId}, order.orderId=${order.orderId}, _id exists=${!!order._id}`);

    if (!orderId) {
      console.warn(`[Notifications] SKIP: no _id for order ${order.orderId}`);
      return;
    }

    const notifData = {
      type: "new_order" as const,
      title: "Nuevo pedido recibido",
      message: `${order.customer.name} ${order.customer.lastName} — $${order.totals.total.toFixed(2)}`,
      orderId,
      orderRef: order.orderId.substring(0, 12),
    };
    console.log(`[Notifications] Creating notification:`, JSON.stringify(notifData));

    await notificationRepository.create(notifData);
    console.log(`[Notifications] SUCCESS: notification created for order ${order.orderId}`);
  } catch (err) {
    // Non-blocking — don't fail the order flow
    console.error("[Notifications] FAILED to create new-order notification:", err);
  }
}

/**
 * Create a "confirmed" notification when admin captures a payment.
 */
export async function notifyOrderConfirmed(order: Order): Promise<void> {
  try {
    const orderId = order._id?.toString();
    if (!orderId) return;

    await notificationRepository.create({
      type: "order_confirmed",
      title: "Pedido confirmado",
      message: `Pago capturado — ${order.customer.name} ${order.customer.lastName}`,
      orderId,
      orderRef: order.orderId.substring(0, 12),
    });
  } catch (err) {
    console.error("[Notifications] Failed to create confirmed notification:", err);
  }
}
