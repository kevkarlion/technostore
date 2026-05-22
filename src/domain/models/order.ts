import type { ObjectId } from "mongodb";

export type OrderStatus =
  | "pending"
  | "reserved"
  | "captured"
  | "cancelled"
  | "failed"
  | "refunded";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface OrderCustomer {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  taxes: number;
  total: number;
}

export interface OrderPayment {
  paymentId?: string;
  paymentMethodId?: string;
  paymentMethodType?: string;
  installments?: number;
  preferenceId?: string;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  timestamp: string; // ISO date
  detail?: string;
}

export interface Order {
  _id?: ObjectId;
  orderId: string;
  externalReference: string;
  status: OrderStatus;
  statusDetail?: string;
  items: OrderItem[];
  totals: OrderTotals;
  customer: OrderCustomer;
  payment?: OrderPayment;
  timeline: OrderTimelineEntry[];
  createdAt: Date;
  updatedAt: Date;
}
