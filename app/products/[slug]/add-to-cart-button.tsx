"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { Toaster, toast } from "sonner";

export function AddToCartButton({
  productId,
  stockQuantity,
}: {
  productId: string;
  stockQuantity?: number;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);

  // Local state - don't touch cart until user clicks "Agregar al carrito"
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Check current quantity in cart
  const currentItem = items.find((item) => item.productId === productId);
  const currentQuantity = currentItem?.quantity || 0;

  // Calculate max allowed quantity based on stock
  const maxAllowed = stockQuantity !== undefined
    ? Math.max(0, stockQuantity - currentQuantity)
    : 999;

  const handleAdd = () => {
    const success = addItem(productId, quantity, stockQuantity);

    if (success) {
      toast.success("Producto agregado al carrito");
      setQuantity(1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      toast.error(
        stockQuantity
          ? `Stock máximo: solo ${stockQuantity} unidades disponibles`
          : "No hay stock disponible"
      );
    }
  };

  const handleIncrease = () => {
    if (quantity < maxAllowed) {
      setQuantity((q) => q + 1);
    } else if (stockQuantity) {
      toast.error(`Stock máximo: ${stockQuantity} unidades`);
    }
  };

  const handleDecrease = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const isMaxReached = stockQuantity !== undefined && quantity >= maxAllowed;

  return (
    <div className="space-y-3">
      <Toaster position="top-right" />

      {/* Quantity selector - local state only */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--foreground-muted)]">Cantidad:</span>
        <div className="flex items-center rounded-lg border border-[var(--border-subtle)]">
          <button
            onClick={handleDecrease}
            className="px-3 py-2 text-lg hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="px-4 py-2 min-w-[40px] text-center font-medium">
            {quantity}
          </span>
          <button
            onClick={handleIncrease}
            className="px-3 py-2 text-lg hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
            disabled={isMaxReached}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {stockQuantity && (
          <span className="text-xs text-[var(--foreground-muted)]">
            ({currentQuantity} en carrito)
          </span>
        )}
      </div>

      {/* Stock warning */}
      {stockQuantity && currentQuantity >= stockQuantity && (
        <p className="text-xs text-amber-400">
          Ya alcanzaste el stock máximo disponible.
        </p>
      )}

      {/* Add to cart button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleAdd}
        aria-label="Add to cart"
        disabled={currentQuantity >= (stockQuantity || 999)}
      >
        {added
          ? "✓ Agregado"
          : currentQuantity >= (stockQuantity || 999)
          ? "Sin stock"
          : "Agregar al carrito"}
      </Button>
    </div>
  );
}