"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useCartStore } from "@/store/cart-store";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductResponseDTO } from "@/domain/dto/product.dto";

export function CartSummary() {
  const { items, updateQuantity, removeItem, clear } = useCartStore();
  
  // Fetch products from API
  const [products, setProducts] = React.useState<Record<string, ProductResponseDTO>>({});
  
  React.useEffect(() => {
    if (items.length === 0) return;
    
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
          console.error('Failed to fetch product:', item.productId, e);
        }
      }
      
      setProducts(productMap);
    };
    
    fetchProducts();
  }, [items.length]);
  
  const enriched = useMemo(
    () =>
      items
        .map((item) => {
          const product = products[item.productId];
          if (!product) return null;
          return { ...item, product } as typeof item & { product: ProductResponseDTO };
        })
        .filter((item): item is typeof item & { product: ProductResponseDTO } => item !== null),
    [items, products]
  );

  const subtotal = enriched.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  if (enriched.length === 0) {
    return (
      <div className="ts-card-muted flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]">
          Tu carrito está vacío.
        </p>
        <p className="max-w-md text-xs text-[var(--foreground-muted)]">
          Navega nuestros productos y agrégalos al carrito.
        </p>
        <Link href="/" className="mt-2">
          <Button size="sm">Empezar a comprar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1.15fr)]">
      <section className="space-y-4">
        {enriched.map((item) => (
          <div
            key={item.productId}
            className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4"
          >
            <div className="flex gap-3">
              {item.product?.imageUrls?.[0] && (
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={item.product.imageUrls[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {item.product?.name}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {item.product?.categories?.[0]}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="mt-2 text-[0.7rem] font-medium text-rose-300 hover:text-rose-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <Price amount={item.product?.price || 0} />
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`qty-${item.productId}`}
                  className="text-[0.7rem] text-[var(--foreground-muted)]"
                >
                  Cant
                </label>
                <Input
                  id={`qty-${item.productId}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(
                      item.productId,
                      Number(e.target.value) || 1
                    )
                  }
                  className="h-8 w-16 rounded-full text-center text-xs"
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={clear}
          className="text-[0.7rem] font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Vaciar carrito
        </button>
      </section>

      <aside className="ts-card h-fit space-y-4">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Resumen del pedido
        </h2>
        <div className="space-y-1 text-xs text-[var(--foreground)]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <Price amount={subtotal} />
          </div>
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Envío</span>
            <span>Se calcula en checkout</span>
          </div>
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Impuestos</span>
            <span>Se calcula en checkout</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-xs">
          <span className="text-[var(--foreground)]">Total</span>
          <Price amount={subtotal} className="text-base" />
        </div>
        <Link href="/checkout">
          <Button className="w-full" size="lg">
            Proceder al checkout
          </Button>
        </Link>
      </aside>
    </div>
  );
}
