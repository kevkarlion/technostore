/**
 * Favorites Store - Zustand con persistencia en localStorage
 * 
 * Sistema de favoritos para el ecommerce.
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/types/domain";

/**
 * Producto almacenado en favoritos (datos embebidos para evitar N+1)
 */
interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  brand?: string;
  inStock?: boolean;
  addedAt: number; // Timestamp para ordenamiento
}

/**
 * Estado del store
 */
interface FavoritesState {
  items: FavoriteProduct[];
  
  // Actions
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (product: Product) => boolean;
  clearAll: () => void;
  
  // Getters
  isFavorite: (productId: string) => boolean;
  getCount: () => number;
  getAll: () => FavoriteProduct[];
}

/**
 * Creación del store con persistencia en localStorage
 */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      addFavorite: (product: Product) => {
        set((state) => {
          // Evitar duplicados
          if (state.items.some((item) => item.id === product.id)) {
            return state;
          }

          const favoriteProduct: FavoriteProduct = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            originalPrice: product.originalPrice,
            imageUrl: product.images?.[0]?.src || "",
            brand: product.brand,
            inStock: product.inStock,
            addedAt: Date.now(),
          };

          return {
            items: [...state.items, favoriteProduct],
          };
        });
      },

      removeFavorite: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      toggleFavorite: (product: Product) => {
        const isFav = get().isFavorite(product.id);
        
        if (isFav) {
          get().removeFavorite(product.id);
          return false;
        } else {
          get().addFavorite(product);
          return true;
        }
      },

      clearAll: () => set({ items: [] }),

      // Getters
      isFavorite: (productId: string) => {
        return get().items.some((item) => item.id === productId);
      },

      getCount: () => get().items.length,

      getAll: () => get().items,
    }),
    {
      name: "technostore-favorites-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// ============= SELECTORS OPTIMIZADOS =============

/**
 * Selector para el conteo de favoritos
 * Útil para el badge del navbar
 */
export function useFavoritesCount() {
  return useFavoritesStore((state) => state.items.length);
}

/**
 * Selector para verificar si un producto es favorito
 */
export function useIsFavorite(productId: string) {
  return useFavoritesStore((state) => 
    state.items.some((item) => item.id === productId)
  );
}

/**
 * Selector para todos los favoritos
 */
export function useFavoritesItems() {
  return useFavoritesStore((state) => state.items);
}