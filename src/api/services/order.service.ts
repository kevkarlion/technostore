import { orderRepository } from "@/api/repository/order.repository";
import { customerRepository } from "@/api/repository/customer.repository";
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

    return order;
  },

  async updateOrderStatus(id: string, status: Order["status"], detail?: string) {
    const order = await orderRepository.updateStatus(id, status, detail);
    if (!order) {
      throw notFound("Orden no encontrada");
    }
    return order;
  },
};
