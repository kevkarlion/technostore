/**
 * CartItemRow - Fila de producto en el carrito
 * 
 * Muestra la imagen, nombre, precio, controls de cantidad
 * y subtotal por producto.
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState, useEffect } from "react";
import { Price } from "@/components/ui/price";
import { Input } from "@/components/ui/input";
import type { CartItem, CartProduct } from "../types/cart";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

/**
 * Carga datos del producto desde la API si no están embebidos
 */
function useProductData(productId: string, embeddedProduct?: CartProduct) {
  const [product, setProduct] = useState<CartProduct | null>(embeddedProduct || null);
  const [isLoading, setIsLoading] = useState(!embeddedProduct);

  useEffect(() => {
    if (embeddedProduct) {
      setProduct(embeddedProduct);
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct({
            id: data.id,
            name: data.name,
            price: data.price,
            imageUrl: data.imageUrls?.[0] || data.cloudinaryUrls?.[0],
            stock: data.stock,
            inStock: data.inStock,
          });
        }
      } catch (e) {
        console.error("Error loading product:", productId);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, embeddedProduct]);

  return { product, isLoading };
}

/**
 * Botones de cantidad (reutilizable para desktop y mobile)
 */
function QuantityControls({ 
  quantity, 
  productId, 
  stock,
  onUpdateQuantity 
}: { 
  quantity: number; 
  productId: string; 
  stock?: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}) {
  const handleIncrement = useCallback(() => {
    onUpdateQuantity(productId, quantity + 1);
  }, [productId, quantity, onUpdateQuantity]);

  const handleDecrement = useCallback(() => {
    if (quantity > 1) {
      onUpdateQuantity(productId, quantity - 1);
    }
  }, [productId, quantity, onUpdateQuantity]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      onUpdateQuantity(productId, val);
    }
  }, [productId, onUpdateQuantity]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-lg font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] active:scale-95 transition-all disabled:opacity-40"
        aria-label="Reducir cantidad"
      >
        −
      </button>
      <Input
        type="number"
        value={quantity}
        onChange={handleChange}
        min={1}
        className="h-9 w-14 rounded-lg border border-[var(--border-subtle)] bg-transparent text-center text-sm font-medium"
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-lg font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] active:scale-95 transition-all"
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}

/**
 * Row de un producto en el carrito (Desktop)
 */
export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { quantity, productId } = item;
  const { product, isLoading } = useProductData(productId, item.product);

  const subtotal = product ? product.price * quantity : 0;

  if (isLoading || !product) {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 animate-pulse">
        <div className="h-20 w-20 rounded-lg bg-[var(--background)]" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-[var(--background)]" />
          <div className="h-4 w-1/4 rounded bg-[var(--background)]" />
          <div className="h-9 w-32 rounded-lg bg-[var(--background)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
      {/* Imagen */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--background)]">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--foreground-muted)]">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${product.id}`} className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)] line-clamp-2">
            {product.name}
          </Link>
          <button type="button" onClick={() => onRemove(productId)} className="text-xs font-medium text-rose-400 hover:text-rose-300">
            Eliminar
          </button>
        </div>

        <div className="text-xs text-[var(--foreground-muted)]">
          <Price amount={product.price} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <QuantityControls quantity={quantity} productId={productId} stock={product.stock} onUpdateQuantity={onUpdateQuantity} />
          <div className="text-sm font-semibold text-[var(--foreground)]">
            <Price amount={subtotal} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Versión para móviles (toda la información en una fila)
 */
export function CartItemRowMobile({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { quantity, productId } = item;
  const { product, isLoading } = useProductData(productId, item.product);
  
  const subtotal = product ? product.price * quantity : 0;

  const handleIncrement = useCallback(() => {
    onUpdateQuantity(productId, quantity + 1);
  }, [productId, quantity, onUpdateQuantity]);

  const handleDecrement = useCallback(() => {
    if (quantity > 1) {
      onUpdateQuantity(productId, quantity - 1);
    }
  }, [productId, quantity, onUpdateQuantity]);

  if (isLoading || !product) {
    return (
      <div className="flex gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 animate-pulse">
        <div className="h-16 w-16 rounded-lg bg-[var(--background)]" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-3/4 rounded bg-[var(--background)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--background)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
      {/* Imagen más grande para mobile */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--background)]">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="96px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-[var(--foreground)] line-clamp-2 flex-1">
            {product.name}
          </span>
          <button type="button" onClick={() => onRemove(productId)} className="text-rose-400 text-xs">
            ✕
          </button>
        </div>
        
        <div className="text-xs text-[var(--foreground-muted)]">
          <Price amount={product.price} />
        </div>

        {/* Controls grandes para touch */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[var(--border-subtle)] text-xl font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] active:scale-95 transition-all disabled:opacity-30"
              aria-label="Reducir"
            >
              −
            </button>
            <span className="min-w-[32px] text-center text-base font-bold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)] text-xl font-bold text-[var(--background)] active:scale-95 transition-all"
              aria-label="Aumentar"
            >
              +
            </button>
          </div>
          
          <div className="text-sm font-bold text-[var(--foreground)]">
            <Price amount={subtotal} />
          </div>
        </div>
      </div>
    </div>
  );
}