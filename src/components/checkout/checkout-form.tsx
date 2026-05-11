"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";

// Schema optimizado - solo lo esencial
const customerSchema = z.object({
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Teléfono muy corto"),
  name: z.string().min(2, "Nombre requerido"),
  lastName: z.string().min(2, "Apellido requerido"),
  address: z.string().min(5, "Dirección requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  postalCode: z.string().min(4, "CP requerido"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

// Componente de input premium
function PremiumInput({ 
  label, 
  type = "text", 
  icon,
  autoComplete,
  register,
  error,
  placeholder,
  delay = 0
}: {
  label: string;
  type?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  register?: any;
  error?: string;
  placeholder?: string;
  delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
    setVisible(true);
  }, [delay]);

  if (!visible) return <div className="h-16" />;

  return (
    <div 
      className={`relative transition-all duration-300 ${
        error ? "animate-shake" : ""
      }`}
      style={{ 
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)"
      }}
    >
      <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-0.5">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-[#009EE3]">
            {icon}
          </div>
        )}
        <input
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          {...register}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full px-4 py-3.5 bg-slate-900/80 rounded-xl border text-base text-slate-100 
            placeholder:text-slate-500 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#009EE3]/30 focus:border-[#009EE3]
            ${icon ? "pl-11" : ""}
            ${error 
              ? "border-red-500/50 bg-red-500/5 focus:ring-red-500/30 focus:border-red-500" 
              : "border-slate-700/80 hover:border-slate-600"
            }
          `}
        />
        {/* Success indicator */}
        {!error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1.5 ml-0.5">
          <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
}

// Progress Stepper
function CheckoutProgress({ step }: { step: number }) {
  const steps = [
    { num: 1, label: "Contacto" },
    { num: 2, label: "Entrega" },
    { num: 3, label: "Pago" },
  ];

  return (
    <div className="flex items-center justify-between mb-6 px-1">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div 
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                transition-all duration-300
                ${step >= s.num 
                  ? "bg-[#009EE3] text-white" 
                  : "bg-slate-800 text-slate-500"
                }
              `}
            >
              {step > s.num ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s.num
              )}
            </div>
            <span className={`text-xs mt-1.5 ${step >= s.num ? "text-[#009EE3]" : "text-slate-500"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${step > s.num ? "bg-[#009EE3]" : "bg-slate-800"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Floating Summary Card
function OrderSummary({ 
  items, 
  products, 
  total 
}: { 
  items: any[], 
  products: any, 
  total: number 
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-900/80 rounded-xl border border-slate-800"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-sm text-slate-300">
            {items.length} {items.length === 1 ? "producto" : "productos"}
          </span>
          <span className="text-sm font-semibold text-white ml-2">
            <Price amount={total} />
          </span>
        </div>
        <svg 
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expanded && (
        <div className="mt-2 p-4 bg-slate-900/50 rounded-xl space-y-2 animate-fadeIn">
          {items.map((item) => {
            const product = products[item.productId];
            return product ? (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-slate-400">{product.name} x{item.quantity}</span>
                <span className="text-slate-200"><Price amount={product.price * item.quantity} /></span>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

interface CheckoutFormProps {
  items: any[];
  products: Record<string, any>;
  total: number;
  onSubmit: (data: CustomerFormData) => void;
  isLoading?: boolean;
}

export function CheckoutForm({ items, products, total, onSubmit, isLoading }: CheckoutFormProps) {
  const [step, setStep] = useState(1);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    mode: "onChange",
  });

  // Track completed fields for visual feedback
  const handleFieldComplete = (field: string, valid: boolean) => {
    setCompletedFields(prev => {
      const next = new Set(prev);
      if (valid) next.add(field);
      else next.delete(field);
      return next;
    });
  };

  // Steps: 1 = Contact, 2 = Address, 3 = Submit
  const canProceedToStep2 = completedFields.has("email") && 
                            completedFields.has("phone") && 
                            completedFields.has("name") && 
                            completedFields.has("lastName");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <CheckoutProgress step={step} />
      
      {/* Step 1: Contact - Priority fields */}
      <div className="space-y-4">
        {step === 1 && (
          <div className="space-y-3 animate-fadeIn">
            <PremiumInput
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              register={register("email")}
              error={errors.email?.message}
              placeholder="tu@email.com"
              delay={0}
              {...register("email", {
                onChange: (e) => handleFieldComplete("email", e.target.value.includes("@") && e.target.value.includes("."))
              })}
            />
            
            <PremiumInput
              label="Teléfono"
              type="tel"
              autoComplete="tel"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
              register={register("phone")}
              error={errors.phone?.message}
              placeholder="11 2345 6789"
              delay={100}
              {...register("phone", {
                onChange: (e) => handleFieldComplete("phone", e.target.value.length >= 10)
              })}
            />

            <div className="grid grid-cols-2 gap-3">
              <PremiumInput
                label="Nombre"
                autoComplete="given-name"
                register={register("name")}
                error={errors.name?.message}
                placeholder="Juan"
                delay={200}
                {...register("name", {
                  onChange: (e) => handleFieldComplete("name", e.target.value.length >= 2)
                })}
              />
              <PremiumInput
                label="Apellido"
                autoComplete="family-name"
                register={register("lastName")}
                error={errors.lastName?.message}
                placeholder="Pérez"
                delay={250}
                {...register("lastName", {
                  onChange: (e) => handleFieldComplete("lastName", e.target.value.length >= 2)
                })}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 animate-fadeIn">
            <PremiumInput
              label="Dirección"
              autoComplete="street-address"
              register={register("address")}
              error={errors.address?.message}
              placeholder="Av. Santa Fe 1234"
              delay={0}
              {...register("address", {
                onChange: (e) => handleFieldComplete("address", e.target.value.length >= 5)
              })}
            />

            <div className="grid grid-cols-2 gap-3">
              <PremiumInput
                label="Ciudad"
                autoComplete="address-level2"
                register={register("city")}
                error={errors.city?.message}
                placeholder="Buenos Aires"
                delay={100}
                {...register("city", {
                  onChange: (e) => handleFieldComplete("city", e.target.value.length >= 2)
                })}
              />
              <PremiumInput
                label="Código postal"
                autoComplete="postal-code"
                register={register("postalCode")}
                error={errors.postalCode?.message}
                placeholder="1425"
                delay={150}
                {...register("postalCode", {
                  onChange: (e) => handleFieldComplete("postalCode", e.target.value.length >= 4)
                })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3.5 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            ← Atrás
          </Button>
        )}
        
        {step === 1 && canProceedToStep2 && (
          <Button
            type="button"
            onClick={() => setStep(2)}
            className="flex-1 py-3.5 bg-[#009EE3] hover:bg-[#00B3F0] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#009EE3]/20"
          >
            Continuar →
          </Button>
        )}

        {step === 2 && (
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3.5 bg-[#009EE3] hover:bg-[#00B3F0] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#009EE3]/20 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </span>
            ) : (
              <>
                Continuar al pago →
              </>
            )}
          </Button>
        )}
      </div>

      {/* Trust badges - Mobile optimized */}
      <div className="flex items-center justify-center gap-4 py-4 text-slate-500">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs">Datos seguros</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs">Compra protegida</span>
        </div>
      </div>

      {/* Mobile Summary */}
      <OrderSummary items={items} products={products} total={total} />
    </form>
  );
}

export type { CustomerFormData };