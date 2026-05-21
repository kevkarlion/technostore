/**
 * Cart Page - Server Component
 * 
 * Solo exporta metadata (Server Component requirement).
 * El contenido real está en CartClient.
 */

import type { Metadata } from "next";
import { CartClient } from "./cart-client";

export const metadata: Metadata = {
  title: "Carrito de Compras",
  description: "Revisa y modifica los productos en tu carrito antes de proceder al checkout.",
};

export default function CartPage() {
  return <CartClient />;
}