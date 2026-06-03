/**
 * AddToCartButton - Botón para agregar productos al carrito
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/cart/store/cart-store";
import { toast } from "sonner";
import { generateProductSlug } from "@/domain/mappers/product-to-presentation";
import type { CartProduct } from "@/features/cart/types/cart";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl?: string;
  inStock: boolean;
  stockQuantity?: number;
}

export function AddToCartButton({
  productId,
  productName,
  productPrice,
  productImageUrl,
  inStock,
  stockQuantity,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const cartProduct: CartProduct = useMemo(() => ({
    id: productId,
    name: productName,
    slug: generateProductSlug(productName),
    price: productPrice,
    imageUrl: productImageUrl,
    stock: stockQuantity,
    inStock,
  }), [productId, productName, productPrice, productImageUrl, stockQuantity, inStock]);

  const handleAdd = useCallback(() => {
    if (!inStock) {
      toast.error("Producto sin stock disponible");
      return;
    }

    const result = addItem(productId, quantity, cartProduct);

    if (result.success) {
      toast.success("Producto agregado al carrito");
      setQuantity(1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      if (result.error === 'MAX_STOCK_REACHED' && stockQuantity && stockQuantity > 0) {
        toast.error(`Stock máximo: solo ${stockQuantity} unidades disponibles`);
      } else {
        toast.error(result.message || "No hay stock disponible");
      }
    }
  }, [addItem, cartProduct, inStock, productId, quantity, stockQuantity]);

  const handleIncrease = useCallback(() => {
    if (!inStock) return;
    setQuantity((q) => q + 1);
  }, [inStock]);

  const handleDecrease = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  return (
    <div className="space-y-3">
      {/* Selector de cantidad */}
      <div className="flex items-center justify-center gap-3">
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
            className="px-3 py-2 text-lg hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Botón agregar */}
      <Button
        id="add-to-cart"
        size="lg"
        className="w-full"
        onClick={handleAdd}
        aria-label="Add to cart"
        disabled={!inStock}
      >
        {added
          ? "✓ Agregado"
          : !inStock
          ? "Sin stock"
          : "Agregar al carrito"}
      </Button>
    </div>
  );
}