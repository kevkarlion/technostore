/**
 * AddToCartButton - Botón para agregar productos al carrito
 * 
 * VERSIÓN 2.0 - Compatible con el nuevo store de cart.
 * Usa datos embebidos del producto para evitar N+1 requests.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/cart/store/cart-store";
import { Toaster, toast } from "sonner";
import type { CartProduct } from "@/features/cart/types/cart";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl?: string;
  inStock: boolean;
  stockQuantity?: number;
}

/**
 * Botón para agregar productos al carrito
 * 
 * @example
 * ```tsx
 * <AddToCartButton 
 *   productId={product.id}
 *   productName={product.name}
 *   productPrice={product.price}
 *   productImageUrl={product.imageUrls?.[0]}
 *   inStock={product.inStock}
 *   stockQuantity={product.stock}
 * />
 * ```
 */
export function AddToCartButton({
  productId,
  productName,
  productPrice,
  productImageUrl,
  inStock,
  stockQuantity,
}: AddToCartButtonProps) {
  // Usar el nuevo store
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);

  // Local state para la UI
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Obtener cantidad actual en el carrito
  const currentItem = items.find((item) => item.productId === productId);
  const currentQuantity = currentItem?.quantity || 0;

  // Calcular cantidad máxima permitida
  const maxAllowed = inStock && stockQuantity !== undefined
    ? Math.max(0, stockQuantity - currentQuantity)
    : inStock ? 999 : 0;

  // Crear el CartProduct para embebber
  const cartProduct: CartProduct = useMemo(() => ({
    id: productId,
    name: productName,
    price: productPrice,
    imageUrl: productImageUrl,
    stock: stockQuantity,
    inStock,
  }), [productId, productName, productPrice, productImageUrl, stockQuantity, inStock]);

  const handleAdd = useCallback(() => {
    // Validar stock
    if (!inStock) {
      toast.error("Producto sin stock disponible");
      return;
    }

    // Intentar agregar al carrito
    const result = addItem(productId, quantity, cartProduct);

    if (result.success) {
      toast.success("Producto agregado al carrito");
      setQuantity(1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } else {
      // Mostrar error según el tipo
      if (result.error === 'MAX_STOCK_REACHED' && stockQuantity && stockQuantity > 0) {
        toast.error(`Stock máximo: solo ${stockQuantity} unidades disponibles`);
      } else {
        toast.error(result.message || "No hay stock disponible");
      }
    }
  }, [addItem, cartProduct, inStock, productId, quantity, stockQuantity]);

  const handleIncrease = useCallback(() => {
    if (!inStock) {
      toast.error("Producto sin stock disponible");
      return;
    }
    if (quantity < maxAllowed) {
      setQuantity((q) => q + 1);
    } else if (stockQuantity && stockQuantity > 0) {
      toast.error(`Stock máximo: ${stockQuantity} unidades`);
    }
  }, [inStock, quantity, maxAllowed, stockQuantity]);

  const handleDecrease = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const isMaxReached = inStock && stockQuantity !== undefined && quantity >= maxAllowed;

  return (
    <div className="space-y-3">
      <Toaster position="bottom-right" />

      {/* Selector de cantidad */}
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

      {/* Warning de stock */}
      {stockQuantity && currentQuantity >= stockQuantity && (
        <p className="text-xs text-amber-400">
          Ya alcanzaste el stock máximo disponible.
        </p>
      )}

      {/* Botón agregar */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleAdd}
        aria-label="Add to cart"
        disabled={!inStock || currentQuantity >= (stockQuantity || 999)}
      >
        {added
          ? "✓ Agregado"
          : !inStock
          ? "Sin stock"
          : currentQuantity >= (stockQuantity || 999)
          ? "Stock máximo alcanzado"
          : "Agregar al carrito"}
      </Button>
    </div>
  );
}