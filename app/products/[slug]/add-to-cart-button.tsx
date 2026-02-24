"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export function AddToCartButton({ productId }: { productId: string }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <Button
      size="lg"
      className="w-full sm:w-auto"
      onClick={() => addItem(productId, 1)}
      aria-label="Add to cart"
    >
      Add to cart
    </Button>
  );
}

