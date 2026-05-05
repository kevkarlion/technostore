/**
 * Cart Feature Types
 * 
 * Tipos para el sistema de carrito de compras.
 * Diseñado para evitar N+1 requests embebiendo datos del producto.
 */

import type { Product } from "@/domain/models/product";

/**
 * Producto reducido para el carrito.
 * Solo guardamos los datos necesarios para mostrar en el carrito
 * y evitar llamadas API adicionales.
 */
export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stock?: number;
  inStock?: boolean;
}

/**
 * Item individual del carrito.
 * Incluye los datos del producto embebidos para evitar N+1.
 */
export interface CartItem {
  productId: string;
  quantity: number;
  product: CartProduct;
}

/**
 * Crea un CartProduct desde un Product del dominio.
 * @param product - Producto del dominio
 * @returns CartProduct para usar en el carrito
 */
export function mapProductToCartProduct(product: Product): CartProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrls?.[0] || product.cloudinaryUrls?.[0],
    stock: product.stock,
    inStock: product.inStock,
  };
}

/**
 * Estado computado del carrito (para helpers)
 */
export interface ComputedCart {
  isEmpty: boolean;
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

/**
 * Configuración de precios del carrito
 */
export interface CartPricingConfig {
  shippingCost: number;
  taxRate: number;
}

/**
 * Configuración por defecto
 */
export const DEFAULT_CART_CONFIG: CartPricingConfig = {
  shippingCost: 500, // $500 envío
  taxRate: 0.21,     // 21% IVA
};

/**
 * Calcula el estado computado del carrito
 */
export function computeCart(
  items: CartItem[],
  config: CartPricingConfig = DEFAULT_CART_CONFIG
): ComputedCart {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const tax = Math.round(subtotal * config.taxRate);
  const shipping = items.length > 0 ? config.shippingCost : 0;
  const total = subtotal + tax + shipping;

  return {
    isEmpty: items.length === 0,
    totalItems,
    subtotal,
    tax,
    shipping,
    total,
  };
}

/**
 * Tipos para agregar productos al carrito
 */
export interface AddToCartParams {
  productId: string;
  quantity?: number;
  product: CartProduct; // Datos embebidos
}

/**
 * Resultado de agregar al carrito
 */
export interface AddToCartResult {
  success: boolean;
  message?: string;
  error?: 'OUT_OF_STOCK' | 'MAX_STOCK_REACHED' | 'UNKNOWN';
}