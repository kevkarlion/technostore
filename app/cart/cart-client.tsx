/**
 * CartClient - Cliente del carrito (Client Component)
 * 
 *Toda la lógica del carrito en un Client Component.
 */

"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/features/cart/store/cart-store";
import {
  CartList,
  CartSummary,
  CartEmpty,
  CartSummarySkeleton,
} from "@/features/cart/components";
import type { CartItem, CartProduct } from "@/features/cart/types/cart";

// ============= FUNCIONES DE MIGRACIÓN =============

/**
 * Item del old store (compatibilidad)
 */
interface LegacyCartItem {
  productId: string;
  quantity: number;
  product?: never;
}

/**
 * Verifica si un item es del formato antiguo (sin datos embebidos)
 */
function isLegacyItem(item: any): item is LegacyCartItem {
  return !item.product || !item.product.id;
}

/**
 * Migra un item del formato viejo al nuevo, cargando datos desde API
 */
async function migrateLegacyItem(item: LegacyCartItem): Promise<CartItem | null> {
  try {
    const response = await fetch(`/api/products/${item.productId}`);
    
    if (!response.ok) {
      console.warn(`[Cart] Could not fetch product ${item.productId}`);
      return null;
    }
    
    const productData = await response.json();
    
    const cartProduct: CartProduct = {
      id: productData.id,
      name: productData.name,
      price: productData.price,
      imageUrl: productData.imageUrls?.[0] || productData.cloudinaryUrls?.[0],
      stock: productData.stock,
      inStock: productData.inStock,
    };
    
    return {
      productId: item.productId,
      quantity: item.quantity,
      product: cartProduct,
    };
  } catch (error) {
    console.error(`[Cart] Error migrating item ${item.productId}:`, error);
    return null;
  }
}

// ============= COMPONENTES =============

function CartLoadingState() {
  return (
    <div className="space-y-6">
      {/* Lista de items skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
            <div className="h-20 w-20 rounded-lg bg-[var(--background)] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded bg-[var(--background)] animate-pulse" />
              <div className="h-4 w-1/4 rounded bg-[var(--background)] animate-pulse" />
              <div className="h-8 w-32 rounded-lg bg-[var(--background)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary skeleton */}
      <CartSummarySkeleton />
    </div>
  );
}

/**
 * Componente cliente del carrito
 */
export function CartClient() {
  // Usar el store directamente
  const store = useCartStore();
  const items = store.items;
  const updateQuantity = store.updateQuantity;
  const removeItem = store.removeItem;
  const clear = store.clear;
  
  // Estado de carga inicial
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Marcar como listo después del mount (permite que el store se hidrate)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Mientras está cargando, mostrar skeleton
  if (isLoading || !isReady) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Carrito de Compras
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Cargando productos...
          </p>
        </header>
        <CartLoadingState />
      </div>
    );
  }
  
  // Calcular totales
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.21);
  const shipping = items.length > 0 ? 500 : 0;
  const total = subtotal + tax + shipping;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Carrito vacío
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Carrito de Compras
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Ajusta quantities, remove productos y obtén un resumen instantáneo.
          </p>
        </header>
        <CartEmpty />
      </div>
    );
  }
  
  // Carrito con productos
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Carrito de Compras
        </h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          {totalItems} {totalItems === 1 ? 'producto' : 'productos'} en tu carrito
        </p>
      </header>
      
      {/* Grid: Lista + Resumen */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Lista de productos */}
        <CartList
          items={items}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
        />
        
        {/* Resumen */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CartSummary
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={total}
            itemCount={totalItems}
            onClear={clear}
            showCheckoutButton={true}
          />
        </div>
      </div>
    </div>
  );
}