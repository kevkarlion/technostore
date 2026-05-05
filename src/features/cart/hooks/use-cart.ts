/**
 * useCart Hook - Interfaz de alto nivel para el carrito
 * 
 * Proporciona una API limpia y tipada para usar el carrito
 * en cualquier componente de la aplicación.
 */

"use client";

import { useCallback, useMemo } from "react";
import { useCartStore } from "../store/cart-store";
import type { CartItem, CartProduct, AddToCartResult, ComputedCart } from "../types/cart";
import { computeCart, DEFAULT_CART_CONFIG } from "../types/cart";

/**
 * Hook principal para usar el carrito
 * 
 * @example
 * ```tsx
 * const { items, addItem, removeItem, total, isEmpty } = useCart();
 * 
 * // Agregar producto
 * addItem({
 *   productId: product.id,
 *   quantity: 1,
 *   product: {
 *     id: product.id,
 *     name: product.name,
 *     price: product.price,
 *     imageUrl: product.imageUrls?.[0],
 *     stock: product.stock,
 *     inStock: product.inStock,
 *   }
 * });
 * ```
 */
export function useCart() {
  const store = useCartStore();

  // Computar estado derivado solo cuando cambian los items
  const computed = useMemo<ComputedCart>(() => {
    return computeCart(store.items, DEFAULT_CART_CONFIG);
  }, [store.items]);

  // Acciones - wrapped con useCallback para evitar re-renders
  const addItem = useCallback(
    (productId: string, quantity: number, product: CartProduct): AddToCartResult => {
      return store.addItem(productId, quantity, product);
    },
    [store]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number): AddToCartResult => {
      return store.updateQuantity(productId, quantity);
    },
    [store]
  );

  const incrementQuantity = useCallback(
    (productId: string): AddToCartResult => {
      return store.incrementQuantity(productId);
    },
    [store]
  );

  const decrementQuantity = useCallback(
    (productId: string): AddToCartResult => {
      return store.decrementQuantity(productId);
    },
    [store]
  );

  const removeItem = useCallback(
    (productId: string) => {
      store.removeItem(productId);
    },
    [store]
  );

  const clear = useCallback(() => {
    store.clear();
  }, [store]);

  // Getters
  const getItemQuantity = useCallback(
    (productId: string) => store.getItemQuantity(productId),
    [store]
  );

  const getItem = useCallback(
    (productId: string) => store.getItem(productId),
    [store]
  );

  return {
    // Estado
    items: store.items,
    isEmpty: computed.isEmpty,
    totalItems: computed.totalItems,
    subtotal: computed.subtotal,
    tax: computed.tax,
    shipping: computed.shipping,
    total: computed.total,

    // Acciones
    addItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clear,

    // Getters
    getItemQuantity,
    getItem,
  };
}

/**
 * Hook para usar solo el conteo del carrito
 * Optimizado para el badge del navbar
 * 
 * @example
 * ```tsx
 * const count = useCartItemCount();
 * ```
 */
export function useCartItemCount() {
  return useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
}

/**
 * Hook para verificar si un producto está en el carrito
 * 
 * @example
 * ```tsx
 * const { isInCart, quantity } = useCartProduct(productId);
 * ```
 */
export function useCartProduct(productId: string) {
  const item = useCartStore((state) =>
    state.items.find((i) => i.productId === productId)
  );

  return {
    isInCart: !!item,
    quantity: item?.quantity || 0,
    item,
  };
}

/**
 * Hook para verificar si el store ha terminado de hidratar
 * Evita errores de hidratación en Next.js
 * 
 * @example
 * ```tsx
 * const { ready } = useCartHydrated();
 * if (!ready) return <Skeleton />;
 * ```
 */
export function useCartHydrated() {
  const hasHydrated = useCartStore((state) => (state as any)._hasHydrated);
  return hasHydrated ?? false;
}

/**
 * Hook para añadir producto rápido con validaciones
 * Especialmente útil para el AddToCartButton
 * 
 * @example
 * ```tsx
 * const { add, canAdd } = useAddToCart(product);
 * 
 * // En el handler:
 * const result = add(1);
 * if (!result.success) {
 *   toast.error(result.message);
 * }
 * ```
 */
export function useAddToCart(product: CartProduct) {
  const store = useCartStore();

  const canAdd = useCallback(
    (quantity: number = 1) => {
      const existingItem = store.items.find(
        (item) => item.productId === product.id
      );
      const totalQuantity = (existingItem?.quantity || 0) + quantity;

      // Verificar stock
      if (!product.inStock) return { allowed: false, reason: 'SIN_STOCK' };
      if (product.stock !== undefined && totalQuantity > product.stock) {
        return { allowed: false, reason: 'STOCK_MAX', max: product.stock };
      }

      return { allowed: true, reason: null };
    },
    [store.items, product]
  );

  const add = useCallback(
    (quantity: number = 1): AddToCartResult => {
      const check = canAdd(quantity);
      if (!check.allowed) {
        return {
          success: false,
          error: check.reason === 'SIN_STOCK' ? 'OUT_OF_STOCK' : 'MAX_STOCK_REACHED',
          message: check.reason === 'SIN_STOCK' 
            ? 'Producto sin stock disponible'
            : `Stock máximo: ${check.max} unidades`,
        };
      }

      return store.addItem(product.id, quantity, product);
    },
    [store, product, canAdd]
  );

  return { add, canAdd };
}