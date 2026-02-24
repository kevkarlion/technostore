"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCartStore } from "@/store/cart-store";
import { products } from "@/lib/mock-data";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CartSummary() {
  const { items, updateQuantity, removeItem, clear } = useCartStore();

  const enriched = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          return { ...item, product };
        })
        .filter(Boolean) as Array<
        (typeof items)[number] & { product: (typeof products)[number] }
      >,
    [items]
  );

  const subtotal = enriched.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  if (enriched.length === 0) {
    return (
      <div className="ts-card-muted flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-slate-200">
          Your cart is currently empty.
        </p>
        <p className="max-w-md text-xs text-slate-400">
          Browse our curated selection of laptops, components and peripherals to
          start building your next setup.
        </p>
        <Link href="/" className="mt-2">
          <Button size="sm">Start shopping</Button>
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
            className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-50">
                {item.product.name}
              </p>
              <p className="text-xs text-slate-500">
                {item.product.brand} • {item.product.category}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="mt-2 text-[0.7rem] font-medium text-rose-300 hover:text-rose-200"
              >
                Remove
              </button>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <Price amount={item.product.price} />
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`qty-${item.productId}`}
                  className="text-[0.7rem] text-slate-500"
                >
                  Qty
                </label>
                <Input
                  id={`qty-${item.productId}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={item.product.stockQuantity ?? 99}
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
          className="text-[0.7rem] font-medium text-slate-400 hover:text-slate-200"
        >
          Clear cart
        </button>
      </section>

      <aside className="ts-card h-fit space-y-4">
        <h2 className="text-sm font-semibold text-slate-50">
          Order summary
        </h2>
        <div className="space-y-1 text-xs text-slate-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <Price amount={subtotal} />
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Taxes</span>
            <span>Est. at checkout</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
          <span className="text-slate-400">Total</span>
          <Price amount={subtotal} className="text-base" />
        </div>
        <Link href="/checkout">
          <Button className="w-full" size="lg">
            Proceed to checkout
          </Button>
        </Link>
      </aside>
    </div>
  );
}

