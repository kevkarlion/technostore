"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export function AddToCartButton({ productId }: { productId: string }) {
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  
  // Only use local state - don't touch cart store until "Agregar al carrito"
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  
  // Check if product is already in cart
  const currentItem = items.find(item => item.productId === productId);
  const currentQuantity = currentItem?.quantity || 0;
  
  const handleAdd = () => {
    // Add to cart - this updates the navbar counter
    addItem(productId, quantity);
    setQuantity(1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  
  const handleIncrease = () => {
    // Only update local state, NOT the cart
    setQuantity(q => q + 1);
  };
  
  const handleDecrease = () => {
    // Only update local state, NOT the cart
    setQuantity(q => Math.max(1, q - 1));
  };

  return (
    <div className="space-y-3">
      {/* Quantity selector - only local state */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--foreground-muted)]">Cantidad:</span>
        <div className="flex items-center rounded-lg border border-[var(--border-subtle)]">
          <button
            onClick={handleDecrease}
            className="px-3 py-2 text-lg hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="px-4 py-2 min-w-[40px] text-center font-medium">
            {quantity}
          </span>
          <button
            onClick={handleIncrease}
            className="px-3 py-2 text-lg hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      
      {/* Add to cart button - only this updates cart */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleAdd}
        aria-label="Add to cart"
      >
        {added ? "✓ Agregado" : "Agregar al carrito"}
      </Button>
    </div>
  );
}
