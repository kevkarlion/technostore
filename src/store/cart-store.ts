"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/domain";

interface CartState {
  items: CartItem[];
  // Actions
  addItem: (productId: string, quantity?: number, inStock?: boolean, maxStock?: number) => boolean;
  updateQuantity: (productId: string, quantity: number, inStock?: boolean, maxStock?: number) => boolean;
  removeItem: (productId: string) => void;
  clear: () => void;
  // Getters
  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  getItem: (productId: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId, quantity = 1, inStock = true, maxStock?: number) => {
        // First check if product is in stock
        if (!inStock) {
          return false;
        }

        const state = get();
        const existing = state.items.find(
          (item) => item.productId === productId
        );
        const newQuantity = (existing?.quantity || 0) + quantity;

        // Stock limit validation (only if maxStock is defined and > 0)
        if (maxStock !== undefined && maxStock > 0 && newQuantity > maxStock) {
          return false;
        }

        set(() => {
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: newQuantity }
                  : item
              ),
            };
          }
          return {
            items: [...state.items, { productId, quantity }],
          };
        });
        return true;
      },

      updateQuantity: (productId, quantity, inStock = true, maxStock?: number) => {
        if (!inStock) {
          return false;
        }

        if (maxStock !== undefined && maxStock > 0 && quantity > maxStock) {
          return false;
        }

        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((item) => item.productId !== productId),
          }));
          return true;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        }));
        return true;
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      clear: () => set({ items: [] }),

      getItemQuantity: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        return item?.quantity || 0;
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getItem: (productId) => {
        return get().items.find((i) => i.productId === productId);
      },
    }),
    {
      name: "technostore-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Hook para verificar si el store está hidratado
// Usa el callback de onFinishHydration de zustand persist
export function useCartHydrated() {
  const store = useCartStore();
  
  // Zustand persist tiene un método hasHydrated que podemos usar
  // @ts-ignore - persist plugin internals
  const hasHydrated = useCartStore.persist?.hasHydrated?.();
  
  return hasHydrated ?? false;
}