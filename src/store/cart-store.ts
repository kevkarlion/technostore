"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/domain";

interface CartState {
  items: CartItem[];
  addItem: (productId: string, quantity?: number, maxStock?: number) => boolean;
  updateQuantity: (productId: string, quantity: number, maxStock?: number) => boolean;
  removeItem: (productId: string) => void;
  clear: () => void;
  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId, quantity = 1, maxStock?: number) => {
        const state = get();
        const existing = state.items.find(
          (item) => item.productId === productId
        );
        const newQuantity = (existing?.quantity || 0) + quantity;

        // Stock validation
        if (maxStock !== undefined && newQuantity > maxStock) {
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
      updateQuantity: (productId, quantity, maxStock?: number) => {
        // Stock validation
        if (maxStock !== undefined && quantity > maxStock) {
          return false;
        }

        // If quantity <= 0, remove item
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
    }),
    {
      name: "technostore-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

