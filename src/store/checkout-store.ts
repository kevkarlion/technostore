"use client";

import { create } from "zustand";
import type { ProductResponseDTO } from "@/domain/dto/product.dto";

export interface CustomerData {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  tower?: string;
  province: string;
  city: string;
  postalCode: string;
  additionalInstructions?: string;
  saveAddress: boolean;
  sameForBilling: boolean;
}

/** Compose a single address line from structured fields, for backward compat */
export function composeFullAddress(data: CustomerData): string {
  const parts = [data.street, data.number];
  if (data.floor) parts.push(`Piso ${data.floor}`);
  if (data.apartment) parts.push(`Depto ${data.apartment}`);
  if (data.tower) parts.push(`Torre ${data.tower}`);
  return parts.join(", ");
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
  paymentId?: string;
}

export type PaymentStatus = "idle" | "processing" | "success" | "error";

interface CheckoutState {
  customer: CustomerData | null;
  paymentStatus: PaymentStatus;
  orderResult: OrderResult | null;
  error: string | null;
  setCustomerData: (data: CustomerData) => void;
  setOrderResult: (result: OrderResult) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  customer: null,
  paymentStatus: "idle",
  orderResult: null,
  error: null,

  setCustomerData: (data: CustomerData) => {
    set({ customer: data });
  },

  setOrderResult: (result: OrderResult) => {
    set({ orderResult: result, paymentStatus: "success" });
  },

  setPaymentStatus: (status: PaymentStatus) => {
    set({ paymentStatus: status });
  },

  setError: (error: string | null) => {
    set({ error });
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

// ─── Mercado Pago Integration ─────────────────────────────────────────────────

interface PreferenceResponse {
  preferenceId: string;
  initPoint: string;
}

interface PreferenceErrorResponse {
  message: string;
}

/**
 * Creates a Mercado Pago preference and returns the checkout URL.
 */
export async function createMercadoPagoPreference(
  items: Array<{ productId: string; quantity: number }>,
  products: Record<string, ProductResponseDTO>,
  customer: CustomerData
): Promise<{ initPoint: string; preferenceId: string }> {
  const preferenceItems = items.map((item) => {
    const product = products[item.productId];
    return {
      id: item.productId,
      title: product?.name ?? "Producto",
      quantity: item.quantity,
      unit_price: product?.price ?? 0,
      currency_id: "ARS" as const,
    };
  });

  const requestBody = {
    items: preferenceItems,
    payer: {
      name: customer.name,
      surname: customer.lastName,
      email: customer.email,
      phone: { number: customer.phone },
      address: {
        street_name: composeFullAddress(customer),
        zip_code: customer.postalCode,
      },
    },
    externalReference: `ORD-${Date.now()}`,
  };

  const response = await fetch("/api/mercadopago/create-preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMessage = "Error al procesar el pago";
    try {
      const errorData: PreferenceErrorResponse = await response.json();
      errorMessage = errorData.message ?? errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data: PreferenceResponse = await response.json();
  return { initPoint: data.initPoint, preferenceId: data.preferenceId };
}