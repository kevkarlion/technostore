import { notificationRepository } from "@/api/repository/notification.repository";
import type { Order } from "@/domain/models/order";

/**
 * Create a "new order" notification when a customer completes a purchase.
 * Called from orderService.createOrder when a new order is first persisted.
 */
export async function notifyNewOrder(order: Order): Promise<void> {
  try {
    const orderId = order._id?.toString();
    if (!orderId) return;

    await notificationRepository.create({
      type: "new_order",
      title: "Nuevo pedido recibido",
      message: `${order.customer.name} ${order.customer.lastName} — $${order.totals.total.toFixed(2)}`,
      orderId,
      orderRef: order.orderId.substring(0, 12),
    });
    console.log(`[Notifications] New order notification created: ${order.orderId}`);
  } catch (err) {
    // Non-blocking — don't fail the order flow
    console.error("[Notifications] Failed to create new-order notification:", err);
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
