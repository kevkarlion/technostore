import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Enter your shipping and payment details to place your TechnoStore order.",
};

export default function CheckoutPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Checkout
        </h1>
        <p className="text-xs text-slate-400">
          UI-only checkout demo. Integrate your payment provider and backend
          order APIs here.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
        <section
          aria-label="Shipping details"
          className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4"
        >
          <h2 className="text-sm font-semibold text-slate-50">
            Shipping details
          </h2>
          <div className="grid gap-3 text-xs sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="firstName"
                className="block text-[0.7rem] font-medium text-slate-300"
              >
                First name
              </label>
              <Input id="firstName" autoComplete="given-name" />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="lastName"
                className="block text-[0.7rem] font-medium text-slate-300"
              >
                Last name
              </label>
              <Input id="lastName" autoComplete="family-name" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label
                htmlFor="address"
                className="block text-[0.7rem] font-medium text-slate-300"
              >
                Address
              </label>
              <Input id="address" autoComplete="street-address" />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="city"
                className="block text-[0.7rem] font-medium text-slate-300"
              >
                City
              </label>
              <Input id="city" autoComplete="address-level2" />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="postalCode"
                className="block text-[0.7rem] font-medium text-slate-300"
              >
                Postal code
              </label>
              <Input id="postalCode" autoComplete="postal-code" />
            </div>
          </div>
        </section>

        <section
          aria-label="Payment details"
          className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4"
        >
          <h2 className="text-sm font-semibold text-slate-50">
            Payment details
          </h2>
          <div className="grid gap-3 text-xs">
            <div className="space-y-1">
              <label
                htmlFor="cardNumber"
                className="block text-[0.7rem] font-medium text-slate-300"
              >
                Card number
              </label>
              <Input id="cardNumber" autoComplete="cc-number" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="expiry"
                  className="block text-[0.7rem] font-medium text-slate-300"
                >
                  Expiry
                </label>
                <Input id="expiry" autoComplete="cc-exp" placeholder="MM/YY" />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="cvc"
                  className="block text-[0.7rem] font-medium text-slate-300"
                >
                  CVC
                </label>
                <Input id="cvc" autoComplete="cc-csc" />
              </div>
            </div>
          </div>
          <Button size="lg" className="w-full" disabled>
            Place order (wire to API)
          </Button>
        </section>
      </div>
    </div>
  );
}

