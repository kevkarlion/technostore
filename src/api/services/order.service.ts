import { orderRepository } from "@/api/repository/order.repository";
import { customerRepository } from "@/api/repository/customer.repository";
import { notificationRepository } from "@/api/repository/notification.repository";
import { sendBuyerConfirmation, sendAdminNotification } from "@/lib/email/email.service";
import { notifyNewOrder, notifyOrderConfirmed } from "@/lib/admin-notifications";
import type { CreateOrderDTO, ListOrdersQueryDTO } from "@/domain/dto/order.dto";
import type { Order } from "@/domain/models/order";
import { notFound } from "@/api/errors/http-error";

export const orderService = {
  async listOrders(params: ListOrdersQueryDTO) {
    return orderRepository.findPaginated(params);
  },

  async getOrderById(id: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw notFound("Orden no encontrada");
    }
    return order;
  },

  async createOrder(data: CreateOrderDTO) {
    const { order, created } = await orderRepository.upsertByExternalRef(data);

    if (!created) {
      // Idempotent: already exists, return it
      return order;
    }

    // Sync customer data from the order (non-blocking — fire & forget)
    if (data.customer?.email) {
      customerRepository.upsertFromOrder({
        email: data.customer.email,
        name: data.customer.name,
        lastName: data.customer.lastName,
        phone: data.customer.phone,
        address: data.customer.address,
        street: data.customer.street,
        number: data.customer.number,
        floor: data.customer.floor,
        apartment: data.customer.apartment,
        tower: data.customer.tower,
        province: data.customer.province,
        city: data.customer.city,
        postalCode: data.customer.postalCode,
        additionalInstructions: data.customer.additionalInstructions,
        saveAddress: data.customer.saveAddress,
        sameForBilling: data.customer.sameForBilling,
        orderRef: {
          orderId: data.orderId,
          total: data.totals.total,
          status: data.status || "reserved",
          createdAt: new Date(),
        },
      }).catch((err) => {
        // Non-critical — don't fail the order
        console.error("[OrderService] Failed to sync customer:", err);
      });
    }

    // Notify admin of new order (non-blocking)
    notifyNewOrder(order);

    return order;
  },

  async updateOrderStatus(id: string, status: Order["status"], detail?: string) {
    // Read current order FIRST to know the old status
    const currentOrder = await orderRepository.findById(id);
    if (!currentOrder) {
      throw notFound("Orden no encontrada");
    }

    const order = await orderRepository.updateStatus(id, status, detail);
    if (!order) {
      throw notFound("Orden no encontrada");
    }

    // ── Trigger emails when purchase is fully confirmed ────────────────
    // Both conditions met: webhook confirmed (status was "reserved")
    // AND admin captured (status becomes "captured")
    if (currentOrder.status === "reserved" && status === "captured") {
      // Send buyer confirmation + admin notification (non-blocking)
      Promise.all([
        sendBuyerConfirmation(order),
        sendAdminNotification(order),
      ]).then(([buyerSent, adminSent]) => {
        console.log(
          `[OrderService] Confirmation emails for ${order.orderId}: buyer=${buyerSent}, admin=${adminSent}`
        );
      });

      // Create admin panel notification
      notifyOrderConfirmed(order);
    }

    return order;
  },
};
