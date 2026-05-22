import { NextRequest } from "next/server";
import { z } from "zod";
import { orderService } from "@/api/services/order.service";
import {
  createOrderSchema,
  listOrdersQuerySchema,
} from "@/domain/dto/order.dto";
import type { Order } from "@/domain/models/order";
import { badRequest } from "@/api/errors/http-error";

export const orderController = {
  async list(req: NextRequest) {
    const url = new URL(req.url);
    const parsed = listOrdersQuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
      throw badRequest("Parámetros inválidos", parsed.error.flatten());
    }

    const result = await orderService.listOrders(parsed.data);
    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  },

  async getById(id: string) {
    const order = await orderService.getOrderById(id);
    return order;
  },

  async create(req: NextRequest) {
    const json = await req.json();
    const parsed = createOrderSchema.safeParse(json);

    if (!parsed.success) {
      throw badRequest("Datos de orden inválidos", parsed.error.flatten());
    }

    const order = await orderService.createOrder(parsed.data);
    return order;
  },

  async updateStatus(id: string, body: { status: Order["status"]; detail?: string }) {
    const statusSchema = z.object({
      status: z.enum(["pending", "reserved", "captured", "cancelled", "failed", "refunded"]),
      detail: z.string().optional(),
    });

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest("Status inválido", parsed.error.flatten());
    }

    const order = await orderService.updateOrderStatus(id, parsed.data.status, parsed.data.detail);
    return order;
  },
};
