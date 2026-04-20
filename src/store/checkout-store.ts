"use client";

import { create } from "zustand";
import type { ProductResponseDTO } from "@/domain/dto/product.dto";

export interface CustomerData {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface OrderResult {
  orderId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  taxes: number;
  total: number;
  customer: CustomerData;
  createdAt: string;
}

export type PaymentStatus = "idle" | "processing" | "success" | "error";

interface CheckoutState {
  customer: CustomerData | null;
  paymentStatus: PaymentStatus;
  orderResult: OrderResult | null;
  error: string | null;
  setCustomerData: (data: CustomerData) => void;
  processPayment: (
    items: Array<{ productId: string; quantity: number }>,
    products: Record<string, ProductResponseDTO>
  ) => Promise<OrderResult>;
  reset: () => void;
}

const SHIPPING_COST = 500;
const TAX_RATE = 0.21;

function generateOrderId(): string {
  const timestamp = Date.now();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${randomChars}`;
}

export const useCheckoutStore = create<CheckoutState>()((set, get) => ({
  customer: null,
  paymentStatus: "idle",
  orderResult: null,
  error: null,

  setCustomerData: (data: CustomerData) => {
    set({ customer: data });
  },

  processPayment: async (items, products) => {
    const state = get();

    if (!state.customer) {
      throw new Error("Datos del cliente no disponibles");
    }

    set({ paymentStatus: "processing", error: null });

    try {
      // Calculate order totals
      const orderItems = items.map((item) => {
        const product = products[item.productId];
        return {
          productId: item.productId,
          productName: product?.name || "Producto",
          quantity: item.quantity,
          price: product?.price || 0,
        };
      });

      const subtotal = orderItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      const shipping = SHIPPING_COST;
      const taxes = Math.round(subtotal * TAX_RATE);
      const total = subtotal + shipping + taxes;

      // Simulate payment processing (2-3 seconds)
      const delay = 2000 + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 10% random failure rate
      if (Math.random() < 0.1) {
        throw new Error("Error en el procesamiento del pago. Intenta de nuevo.");
      }

      const orderResult: OrderResult = {
        orderId: generateOrderId(),
        items: orderItems,
        subtotal,
        shipping,
        taxes,
        total,
        customer: state.customer,
        createdAt: new Date().toISOString(),
      };

      set({ paymentStatus: "success", orderResult });
      return orderResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      set({ paymentStatus: "error", error: errorMessage });
      throw error;
    }
  },

  reset: () => {
    set({
      customer: null,
      paymentStatus: "idle",
      orderResult: null,
      error: null,
    });
  },
}));