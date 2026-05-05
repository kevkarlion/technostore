/**
 * Cart Store - Zustand con persistencia
 * 
 * Versión 2.0 con datos embebidos del producto.
 * Evita N+1 requests almacenando los datos necesarios del producto.
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, CartProduct, AddToCartResult } from "../types/cart";
import { DEFAULT_CART_CONFIG } from "../types/cart";

/**
 * Estado del store
 */
interface CartState {
  items: CartItem[];
  config: typeof DEFAULT_CART_CONFIG;
  
  // Actions - mutación directa
  addItem: (productId: string, quantity: number, product: CartProduct) => AddToCartResult;
  updateQuantity: (productId: string, quantity: number) => AddToCartResult;
  incrementQuantity: (productId: string) => AddToCartResult;
  decrementQuantity: (productId: string) => AddToCartResult;
  removeItem: (productId: string) => void;
  clear: () => void;
  
  // Getters
  getItemQuantity: (productId: string) => number;
  getItem: (productId: string) => CartItem | undefined;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  isEmpty: () => boolean;
}

/**
 * Validaciones de stock
 */
function validateStock(
  quantity: number,
  product: CartProduct
): AddToCartResult {
  // Validar stock disponible
  if (!product.inStock) {
    return { 
      success: false, 
      error: 'OUT_OF_STOCK',
      message: 'Producto sin stock disponible' 
    };
  }

  // Validar límite de stock si está definido
  if (product.stock !== undefined && product.stock > 0) {
    if (quantity > product.stock) {
      return {
        success: false,
        error: 'MAX_STOCK_REACHED',
        message: `Stock máximo: ${product.stock} unidades`
      };
    }
  }

  return { success: true };
}

/**
 * Creación del store con persistencia en localStorage
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      config: DEFAULT_CART_CONFIG,

      addItem: (productId: string, quantity: number, product: CartProduct) => {
        // Validar stock primero
        const existingItem = get().items.find(
          (item) => item.productId === productId
        );
        
        // Calcular cantidad total si ya existe
        const totalQuantity = (existingItem?.quantity || 0) + quantity;
        
        // Validar contra stock máximo
        const validation = validateStock(totalQuantity, product);
        if (!validation.success) {
          return validation;
        }

        // Agregar o actualizar
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.productId === productId
          );

          if (existingIndex >= 0) {
            // Actualizar cantidad
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: totalQuantity,
            };
            return { items: newItems };
          }

          // Agregar nuevo item
          return {
            items: [
              ...state.items,
              {
                productId,
                quantity,
                product, // Datos embebidos
              },
            ],
          };
        });

        return { 
          success: true, 
          message: `Agregado ${quantity} al carrito` 
        };
      },

      updateQuantity: (productId: string, quantity: number) => {
        // Permitir cualquier cantidad >= 1 sin validar stock para evitar bloqueos
        // El usuario puede comprar lo que quiera mientras haya stock al momento del checkout
        if (quantity <= 0) {
          // Si quantity es 0 o negativo, remover el item
          get().removeItem(productId);
          return { success: true };
        }

        const item = get().items.find((i) => i.productId === productId);
        if (!item) {
          return { 
            success: false, 
            error: 'UNKNOWN',
            message: 'Producto no encontrado en el carrito' 
          };
        }

        // Validar stock
        const validation = validateStock(quantity, item.product);
        if (!validation.success) {
          return validation;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          ),
        }));

        return { success: true };
      },

      incrementQuantity: (productId: string) => {
        const item = get().items.find((i) => i.productId === productId);
        if (!item) {
          return { success: false, error: 'UNKNOWN' };
        }
        
        return get().updateQuantity(productId, item.quantity + 1);
      },

      decrementQuantity: (productId: string) => {
        const item = get().items.find((i) => i.productId === productId);
        if (!item) {
          return { success: false, error: 'UNKNOWN' };
        }
        
        if (item.quantity <= 1) {
          get().removeItem(productId);
          return { success: true };
        }
        
        return get().updateQuantity(productId, item.quantity - 1);
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      clear: () => set({ items: [] }),

      // Getters
      getItemQuantity: (productId: string) => {
        const item = get().items.find((i) => i.productId === productId);
        return item?.quantity || 0;
      },

      getItem: (productId: string) => {
        return get().items.find((i) => i.productId === productId);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getTotal: () => {
        const { subtotal, tax, shipping } = computeCartTotals(get().items);
        return subtotal + tax + shipping;
      },

      isEmpty: () => get().items.length === 0,
    }),
    {
      name: "technostore-cart-v3", // Nueva key - empieza limpio
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Solo persistir items
    }
  )
);

/**
 * Helper para calcular totales (usado internamente)
 */
function computeCartTotals(items: CartItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = Math.round(subtotal * DEFAULT_CART_CONFIG.taxRate);
  const shipping = items.length > 0 ? DEFAULT_CART_CONFIG.shippingCost : 0;
  return { subtotal, tax, shipping };
}

// ============= SELECTORS OPTIMIZADOS =============
// Estos selectors evitan re-renders innecesarios

/**
 * Selector para el conteo total de items
 * Útil para el badge del navbar
 */
export function useCartCount() {
  return useCartStore((state) => 
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
}

/**
 * Selector para verificar si el carrito está vacío
 */
export function useCartIsEmpty() {
  return useCartStore((state) => state.items.length === 0);
}

/**
 * Selector para los items del carrito
 */
export function useCartItems() {
  return useCartStore((state) => state.items);
}

/**
 * Selector para el subtotal
 */
export function useCartSubtotal() {
  return useCartStore((state) => 
    state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );
}