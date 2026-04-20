"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore, type CustomerData } from "@/store/checkout-store";
import { Toaster, toast } from "sonner";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductResponseDTO } from "@/domain/dto/product.dto";

const SHIPPING_COST = 500;
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
  const { paymentStatus, orderResult, error, setCustomerData, processPayment, reset } =
    useCheckoutStore();

  const [products, setProducts] = useState<Record<string, ProductResponseDTO>>({});

  // Fetch products from API
  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
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
  }, [items.length, router]);

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

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const customerData: CustomerData = {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
      };

      setCustomerData(customerData);

      const result = await processPayment(items, products);

      clear();
      router.push("/checkout/success");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error en el procesamiento del pago"
      );
    }
  };

  // Redirect if cart is empty
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Details */}
          <section
            aria-label="Datos del cliente"
            className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4"
          >
            <h2 className="text-sm font-semibold text-slate-50">
              Datos personales
            </h2>
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="name"
                  className="block text-[0.7rem] font-medium text-slate-300"
                >
                  Nombre *
                </label>
                <Input
                  id="name"
                  autoComplete="given-name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-[0.7rem] text-rose-400">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="lastName"
                  className="block text-[0.7rem] font-medium text-slate-300"
                >
                  Apellido *
                </label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-[0.7rem] text-rose-400">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-[0.7rem] font-medium text-slate-300"
                >
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-[0.7rem] text-rose-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="phone"
                  className="block text-[0.7rem] font-medium text-slate-300"
                >
                  Teléfono *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-[0.7rem] text-rose-400">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-[0.7rem] font-medium text-slate-300"
                >
                  Dirección *
                </label>
                <Input
                  id="address"
                  autoComplete="street-address"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-[0.7rem] text-rose-400">
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="city"
                  className="block text-[0.7rem] font-medium text-slate-300"
                >
                  Ciudad *
                </label>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  {...register("city")}
                />
                {errors.city && (
                  <p className="text-[0.7rem] text-rose-400">
                    {errors.city.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="postalCode"
                  className="block text-[0.7rem] font-medium text-slate-300"
                >
                  Código Postal *
                </label>
                <Input
                  id="postalCode"
                  autoComplete="postal-code"
                  {...register("postalCode")}
                />
                {errors.postalCode && (
                  <p className="text-[0.7rem] text-rose-400">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Order Summary Sidebar */}
          <section
            aria-label="Resumen del pedido"
            className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4"
          >
            <h2 className="text-sm font-semibold text-slate-50">
              Resumen del pedido
            </h2>

            {/* Items list */}
            <div className="space-y-2 text-xs">
              {enriched.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between gap-2"
                >
                  <span className="truncate text-slate-300">
                    {item.product?.name} x{item.quantity}
                  </span>
                  <Price
                    amount={(item.product?.price || 0) * item.quantity}
                    className="text-right"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <Price amount={subtotal} />
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <Price amount={shipping} />
              </div>
              <div className="flex justify-between">
                <span>Impuestos (21%)</span>
                <Price amount={taxes} />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-700 pt-3 text-xs">
              <span className="text-slate-50">Total</span>
              <Price amount={total} className="text-base" />
            </div>
          </section>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={paymentStatus === "processing"}
          >
            {paymentStatus === "processing"
              ? "Procesando pago..."
              : `Pagar $${total.toLocaleString("es-AR")}`}
          </Button>

          {error && (
            <p className="text-center text-xs text-rose-400">{error}</p>
          )}
        </form>

        {/* Right sidebar - Order Summary (desktop) */}
        <aside className="hidden lg:block space-y-4">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-50">
              Tu pedido
            </h2>
            <div className="space-y-2 text-xs text-slate-300">
              {enriched.map((item) => (
                <div key={item.productId} className="flex justify-between gap-2">
                  <span className="truncate">
                    {item.product?.name} x{item.quantity}
                  </span>
                  <Price
                    amount={(item.product?.price || 0) * item.quantity}
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