"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/features/cart/store/cart-store";
import { useCheckoutStore, type CustomerData } from "@/store/checkout-store";
import { useOrderStore } from "@/store/order-store";
import { useShallow } from "zustand/react/shallow";
import { Toaster, toast } from "sonner";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import type { ProductResponseDTO } from "@/domain/dto/product.dto";
import { MercadoPagoForm } from "@/components/checkout/mercado-pago-form";
import { CheckoutForm, type CustomerFormData } from "@/components/checkout/checkout-form";

// Subscribe to cart store hydration
function useStoreHydration() {
  return useSyncExternalStore(
    (callback) => {
      const unsub = useCartStore.persist?.onFinishHydration?.(() => callback());
      return () => unsub?.();
    },
    () => useCartStore.persist?.hasHydrated?.() ?? false,
    () => false
  );
}

const SHIPPING_COST = 0; // Free shipping for testing
const TAX_RATE = 0.21;

const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  postalCode: z.string().min(1, "El código postal es requerido"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCartStore();
  const isHydrated = useStoreHydration();
  const { paymentStatus, setCustomerData, setPaymentStatus, setError, reset } =
    useCheckoutStore(
      useShallow((state) => ({
        paymentStatus: state.paymentStatus,
        setCustomerData: state.setCustomerData,
        setPaymentStatus: state.setPaymentStatus,
        setError: state.setError,
        reset: state.reset,
      }))
    );
  const { addOrder } = useOrderStore();

  const [products, setProducts] = useState<Record<string, ProductResponseDTO>>({});
  const [customerData, setCustomerDataLocal] = useState<CustomerData | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch products from API
  useEffect(() => {
    console.log("[Checkout] useEffect:", { isHydrated, itemsLength: items.length, items: items });
    
    // Wait for cart to hydrate before checking items
    if (!isHydrated) {
      console.log("[Checkout] Not hydrated yet, returning");
      return;
    }
    
    // Don't redirect if we just processed a payment (paymentStatus is processing or success)
    if (paymentStatus === "processing" || paymentStatus === "success") {
      console.log("[Checkout] Payment in progress, not redirecting");
      return;
    }
    
    console.log("[Checkout] Hydrated, items:", items);
    
    if (items.length === 0) {
      console.log("[Checkout] Items empty, redirecting to /carrito");
      router.push("/carrito");
      return;
    }

    const fetchProducts = async () => {
      const productMap: Record<string, ProductResponseDTO> = {};

      for (const item of items) {
        try {
          const res = await fetch(`/api/products/${item.productId}`);
          if (res.ok) {
            const product = await res.json();
            productMap[item.productId] = product;
          }
        } catch (e) {
          console.error("Failed to fetch product:", item.productId, e);
        }
      }

      setProducts(productMap);
    };

    fetchProducts();
  }, [items.length, router, isHydrated]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  // Calculate order totals
  const enriched = items
    .map((item) => {
      const product = products[item.productId];
      if (!product) return null;
      return { ...item, product } as (typeof items)[0] & { product: ProductResponseDTO };
    })
    .filter(
      (item): item is (typeof items)[0] & { product: ProductResponseDTO } => item !== null
    );

  const subtotal = enriched.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );
  const shipping = SHIPPING_COST;
  const taxes = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + taxes;

  const onSubmit = (data: CustomerFormData) => {
    const custData: CustomerData = {
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
    };
    setCustomerDataLocal(custData);
    setShowCardForm(true);
  };

  const handlePaymentSubmit = async (data: {
      type: "card" | "rapipago" | "pagofacil";
      token?: string;
      paymentMethodId?: string;
      installments?: number;
      payer: {
        email: string;
        identification: { type: string; number: string };
      };
    }) => {
    if (!customerData) return;
    
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Build items for payment
      const paymentItems = items.map((item) => {
        const product = products[item.productId];
        return {
          id: item.productId,
          title: product?.name || "Producto",
          quantity: item.quantity,
          unit_price: product?.price || 0,
          currency_id: "ARS",
        };
      });

      // Always use order API for all payment types
      const endpoint = "/api/mercadopago/order";

      // Calculate total from items
      const totalAmount = Math.round(paymentItems.reduce((acc, item) => acc + item.unit_price * item.quantity, 0));
      
      // Determine if it's a card payment
      const isCard = data.type === "card";
      
      // For cards, we need payment method ID - try to get it from the form data
      const paymentMethodId = isCard ? (data.paymentMethodId || "visa") : data.type;
      
      // Validate token format
      if (!data.token || data.token.length < 32) {
        console.error("[Checkout] Invalid token:", data.token);
        throw new Error("Token de tarjeta inválido");
      }
      
      console.log("[Checkout] Token:", data.token, "length:", data.token.length);
      console.log("[Checkout] PaymentMethodId:", paymentMethodId);
      console.log("[Checkout] Installments:", data.installments);
      console.log("[Checkout] Sending totalAmount:", totalAmount);

      // For sandbox, always use test@testuser.com
      const payerEmail = data.payer.email.includes('@testuser.com') 
        ? data.payer.email 
        : 'test@testuser.com';
      
      const payload = {
        externalReference: `ORD-${Date.now()}`,
        total_amount: totalAmount, // Send as number, not string
        payer: {
          email: payerEmail,
          first_name: customerData.name,
          last_name: customerData.lastName,
          identification: data.payer.identification,
        },
        transactions: {
          payments: [
            {
              amount: totalAmount,
              payment_method: {
                id: paymentMethodId,
                type: isCard ? "credit_card" : "ticket",
                token: data.token,
                installments: data.installments || 1,
              },
            },
          ],
        },
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("[Checkout] Response status:", response.status);
      console.log("[Checkout] Error response:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.log("[Checkout] Full error details:", JSON.stringify(result, null, 2));
        throw new Error((result as any).message || (result as any).details || "Error al procesar el pago");
      }

      // Payment successful
      console.log("[Checkout] Payment data sent:", {
        token: data.token,
        paymentMethodId: data.paymentMethodId,
        installments: data.installments,
        amount: totalAmount
      });
      console.log("[Checkout] Payment result:", result);
      
      // Save order to store for later management (capture/cancel)
      addOrder({
        id: result.id,
        externalReference: result.external_reference || `ORD-${Date.now()}`,
        totalAmount: totalAmount,
        status: "reserved", // Funds reserved, waiting for capture
        statusDetail: result.transactions?.payments?.[0]?.status_detail,
        paymentMethodId: data.paymentMethodId,
        createdAt: Date.now(),
        customerEmail: payerEmail,
        customerName: customerData ? `${customerData.name} ${customerData.lastName}` : undefined,
      });
      
      clear(); // Clear cart on success
      setPaymentStatus("success");
      
      // For tickets, show the ticket_url
      if (result.ticket_url) {
        router.push("/checkout/success?ticket_url=" + encodeURIComponent(result.ticket_url));
      } else {
        router.push("/checkout/success?payment_id=" + result.id);
      }
    } catch (err) {
      console.error("[Checkout] Payment error:", err);
      setPaymentStatus("error");
      setError(err instanceof Error ? err.message : "Error en el procesamiento del pago");
      toast.error(err instanceof Error ? err.message : "Error en el procesamiento del pago");
      setIsProcessing(false);
    }
  };

  const handleCardError = (error: string) => {
    setError(error);
    toast.error(error);
  };

  // Show loading while cart hydrates
  if (!isHydrated) {
    console.log("[Checkout] Rendering: Not hydrated, showing spinner");
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
      </div>
    );
  }

  // Don't auto-redirect - let user see checkout
  // The onSubmit will handle empty cart case
  if (items.length === 0) {
    console.log("[Checkout] Rendering: items empty, but showing form anyway");
  } else {
    console.log("[Checkout] Rendering: Has items, showing checkout form");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />

      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Checkout
        </h1>
        <p className="text-xs text-slate-400">
          Completá tus datos para finalizar la compra.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
        {showCardForm ? (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCardForm(false)}
            >
              ← Volver
            </Button>
            
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
              <h2 className="text-sm font-semibold text-slate-50 mb-4">
                Datos de tu tarjeta
              </h2>
              {isProcessing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  <span className="ml-3 text-slate-300">Procesando pago...</span>
                </div>
              ) : (
                <MercadoPagoForm
                  onPaymentSubmit={handlePaymentSubmit}
                  customerEmail={customerData?.email || "test@testuser.com"}
                  totalAmount={total}
                  onError={handleCardError}
                />
              )}
            </div>
          </div>
        ) : (
          <CheckoutForm
            items={items}
            products={products}
            total={total}
            onSubmit={(data) => onSubmit(data as any)}
            isLoading={isProcessing}
          />
        )}

        {/* Right sidebar - Order Summary (desktop) */}
        <aside className="hidden lg:block space-y-4">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-50">
              Tu pedido
            </h2>
            <div className="space-y-3 text-xs text-slate-300">
              {enriched.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                    {item.product?.imageUrls?.[0] ? (
                      <Image
                        src={String(item.product.imageUrls[0])}
                        alt={item.product.name || ""}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        📦
                      </div>
                    )}
                  </div>
                  {/* Name & Price */}
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-slate-200">
                      {item.product?.name}
                    </span>
                    <span className="text-slate-500">
                      Cant: {item.quantity}
                    </span>
                  </div>
                  <Price
                    amount={(item.product?.price || 0) * item.quantity}
                    className="text-slate-200"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-slate-700 pt-3 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <Price amount={subtotal} />
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <Price amount={shipping} />
              </div>
              <div className="flex justify-between">
                <span>IVA (21%)</span>
                <Price amount={taxes} />
              </div>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 text-sm font-semibold text-slate-50">
              <span>Total</span>
              <Price amount={total} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}