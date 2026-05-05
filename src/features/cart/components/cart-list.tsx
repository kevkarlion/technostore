/**
 * CartList - Lista de productos del carrito
 * 
 * Renderiza la lista de items del carrito con sus acciones.
 */

"use client";

import { CartItemRow } from "./cart-item-row";
import { CartItemRowMobile } from "./cart-item-row";
import type { CartItem } from "../types/cart";

interface CartListProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

/**
 * Lista de productos del carrito
 * 
 * @example
 * ```tsx
 * <CartList 
 *   items={items} 
 *   onUpdateQuantity={updateQuantity} 
 *   onRemove={removeItem} 
 * />
 * ```
 */
export function CartList({ items, onUpdateQuantity, onRemove }: CartListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-label="Productos en el carrito">
      {/* Desktop: CartItemRow */}
      <div className="hidden md:block space-y-4">
        {items.map((item) => (
          <CartItemRow
            key={item.productId}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* Mobile: CartItemRowMobile */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <CartItemRowMobile
            key={item.productId}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}