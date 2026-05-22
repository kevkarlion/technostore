import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  imageUrl: z.string().optional(),
});

export const orderCustomerSchema = z.object({
  name: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
});

export const orderTotalsSchema = z.object({
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  taxes: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const orderPaymentSchema = z.object({
  paymentId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  paymentMethodType: z.string().optional(),
  installments: z.number().int().positive().optional(),
  preferenceId: z.string().optional(),
});

export const orderTimelineEntrySchema = z.object({
  status: z.enum([
    "pending",
    "reserved",
    "captured",
    "cancelled",
    "failed",
    "refunded",
  ]),
  timestamp: z.string(),
  detail: z.string().optional(),
});

export const createOrderSchema = z.object({
  orderId: z.string().min(1),
  externalReference: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  totals: orderTotalsSchema,
  customer: orderCustomerSchema,
  payment: orderPaymentSchema.optional(),
  timeline: z.array(orderTimelineEntrySchema).default([]),
  status: z
    .enum(["pending", "reserved", "captured", "cancelled", "failed", "refunded"])
    .default("reserved"),
  statusDetail: z.string().optional(),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(["pending", "reserved", "captured", "cancelled", "failed", "refunded"])
    .optional(),
  search: z.string().optional(),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
export type ListOrdersQueryDTO = z.infer<typeof listOrdersQuerySchema>;
