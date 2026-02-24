import type { Metadata } from "next";
import { CartSummary } from "@/features/cart/components/cart-summary";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review and edit the products in your cart before checkout.",
};

export default function CartPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Cart
        </h1>
        <p className="text-xs text-slate-400">
          Adjust quantities, remove products and get an instant order summary.
        </p>
      </header>
      <CartSummary />
    </div>
  );
}

