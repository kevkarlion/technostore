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

// ============= REFRESH DE PRECIOS =============
// La API /api/products/[id] ya devuelve precios en ARS (convertidos con exchange rate).
// Refetcheamos todos los items al cargar la página para asegurar precios frescos en ARS,
// independientemente de si se agregaron antes o después del fix.

/**
 * Refresca un item del carrito desde la API, obteniendo precio ARS fresco.
 */
async function refreshCartItem(item: CartItem): Promise<CartItem | null> {
  try {
    const res = await fetch(`/api/products/${item.productId}`);
    if (!res.ok) {
      console.warn(`[Cart] Could not refresh product ${item.productId}`);
      return null;
    }
    const productData = await res.json();
    // productData.price ya está en ARS (convertido por productMapper.toResponse)
    return {
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: productData.id,
        name: productData.name,
        slug: productData.slug || "",
        price: productData.price,
        imageUrl: String(productData.imageUrls?.[0] || productData.cloudinaryUrls?.[0] || ""),
        stock: productData.stock,
        inStock: productData.inStock,
      },
    };
  } catch (error) {
    console.error(`[Cart] Error refreshing ${item.productId}:`, error);
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
  
  // Refrescar precios desde la API al cargar la página
  // La API /api/products/[id] devuelve precios en ARS, así que esto asegura
  // que el carrito siempre muestre ARS sin importar cuándo se agregaron los items.
  useEffect(() => {
    if (!isReady) return;
    
    const refreshPrices = async () => {
      const currentItems = store.items;
      if (currentItems.length === 0) return;
      
      const refreshedItems = await Promise.all(
        currentItems.map((item) => refreshCartItem(item))
      );
      
      const validItems = refreshedItems.filter(Boolean) as CartItem[];
      if (validItems.length > 0) {
        useCartStore.setState({ items: validItems });
      }
    };
    
    refreshPrices();
  }, [isReady]);
  
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
  const tax = subtotal * 0.21;
  const shipping = 0;
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