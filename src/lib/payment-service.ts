import type { ProductResponseDTO } from "@/domain/dto/product.dto";
import type { CustomerData } from "@/store/checkout-store";

export interface PaymentItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

const SHIPPING_COST = 500;
const TAX_RATE = 0.21;

function generateOrderId(): string {
  const timestamp = Date.now();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${randomChars}`;
}

export async function processPayment(
  items: PaymentItem[],
  customer: CustomerData
): Promise<PaymentResult> {
  // Simulate 2-3 second processing delay
  const delay = 2000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Calculate totals
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shipping = SHIPPING_COST;
  const taxes = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + taxes;

  // 10% random failure rate
  if (Math.random() < 0.1) {
    return {
      success: false,
      error: "Error en el procesamiento del pago. Intenta de nuevo.",
    };
  }

  // Log the order for demo purposes (in production, this would be saved to DB)
  console.log("Order created:", {
    orderId: generateOrderId(),
    items,
    subtotal,
    shipping,
    taxes,
    total,
    customer,
  });

  return {
    success: true,
    orderId: generateOrderId(),
  };
}

export function calculateOrderTotals(
  items: PaymentItem[]
): {
  subtotal: number;
  shipping: number;
  taxes: number;
  total: number;
} {
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shipping = SHIPPING_COST;
  const taxes = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + taxes;

  return { subtotal, shipping, taxes, total };
}