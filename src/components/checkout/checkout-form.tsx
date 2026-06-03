"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { cleanProductName } from "@/domain/mappers/product-to-presentation";

// ─── Constants ───────────────────────────────────────────────────────────────

const PROVINCIAS = [
  "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
  "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
  "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
  "Santiago del Estero", "Tierra del Fuego", "Tucumán",
  "CABA",
];

// ─── Validation Schema ────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  // Contact Info
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresá un email válido"),
  phone: z.string().min(7, "Ingresá un teléfono válido"),

  // Delivery Address
  street: z.string().min(3, "Ingresá la calle"),
  number: z.string().min(1, "Ingresá el número"),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  province: z.string().min(2, "Seleccioná una provincia"),
  city: z.string().min(2, "Ingresá la ciudad"),
  postalCode: z.string().min(4, "Ingresá el código postal"),
  additionalInstructions: z.string().optional(),

  // Dynamic apartment fields
  livesInApartment: z.boolean(),
  tower: z.string().optional(),

  // Preferences
  saveAddress: z.boolean(),
  sameForBilling: z.boolean(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ─── Field Components ─────────────────────────────────────────────────────────

function FormField({
  label,
  optional = false,
  type = "text",
  autoComplete,
  placeholder,
  error,
  rows,
  ...registerProps
}: {
  label: string;
  optional?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  rows?: number;
  [key: string]: unknown;
}) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="group">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-300 mb-1.5"
      >
        {label}
        {optional && (
          <span className="text-slate-500 font-normal ml-1">(opcional)</span>
        )}
      </label>

      {rows ? (
        <textarea
          id={inputId}
          rows={rows}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 bg-slate-900/60 rounded-xl border text-base text-slate-100
            placeholder:text-slate-500 transition-all duration-200 resize-none
            focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]
            ${error
              ? "border-red-500/50 bg-red-500/5 focus:ring-red-500/30 focus:border-red-500"
              : "border-slate-700/60 hover:border-slate-500/60"
            }
          `}
          {...registerProps}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 bg-slate-900/60 rounded-xl border text-base text-slate-100
            placeholder:text-slate-500 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]
            ${error
              ? "border-red-500/50 bg-red-500/5 focus:ring-red-500/30 focus:border-red-500"
              : "border-slate-700/60 hover:border-slate-500/60"
            }
          `}
          {...registerProps}
        />
      )}

      {error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  options,
  placeholder,
  error,
  ...registerProps
}: {
  label: string;
  options: string[];
  placeholder: string;
  error?: string;
  [key: string]: unknown;
}) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="group">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-300 mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={inputId}
          className={`
            w-full px-4 py-3 bg-slate-900/60 rounded-xl border text-base text-slate-100
            transition-all duration-200 appearance-none cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]
            ${error
              ? "border-red-500/50 bg-red-500/5 focus:ring-red-500/30 focus:border-red-500"
              : "border-slate-700/60 hover:border-slate-500/60"
            }
          `}
          {...registerProps}
        >
          <option value="" disabled className="bg-slate-900 text-slate-500">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-900 text-slate-100">
              {opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
}

function CheckboxField({
  label,
  description,
  ...registerProps
}: {
  label: string;
  description?: string;
  [key: string]: unknown;
}) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      htmlFor={inputId}
      className="flex items-start gap-3 cursor-pointer group"
    >
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          id={inputId}
          className="peer sr-only"
          {...registerProps}
        />
        <div className="w-5 h-5 rounded-md border-2 border-slate-600 bg-slate-800/50
                        peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)]
                        transition-all duration-150
                        group-hover:border-slate-500 peer-checked:group-hover:opacity-90"
        />
        <svg
          className="absolute inset-0 w-5 h-5 text-[var(--background)] opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <span className="text-sm text-slate-200 group-hover:text-slate-100 transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold shrink-0">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
        {description && (
          <p className="text-sm text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Toggle (Apartment) ───────────────────────────────────────────────────────

function ToggleField({
  label,
  description,
  ...registerProps
}: {
  label: string;
  description?: string;
  [key: string]: unknown;
}) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      htmlFor={inputId}
      className="flex items-center justify-between p-4 rounded-xl border border-slate-700/60 bg-slate-900/40 cursor-pointer group hover:border-slate-500/60 transition-all duration-200"
    >
      <div>
        <span className="text-sm font-medium text-slate-200 group-hover:text-slate-100 transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="relative">
        <input
          type="checkbox"
          id={inputId}
          className="peer sr-only"
          {...registerProps}
        />
        <div className="w-11 h-6 rounded-full bg-slate-700 peer-checked:bg-[var(--accent)] transition-colors duration-200" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow peer-checked:translate-x-5 transition-transform duration-200" />
      </div>
    </label>
  );
}

// ─── Order Summary (Mobile) ───────────────────────────────────────────────────

export function OrderSummary({
  items,
  products,
  total,
}: {
  items: any[];
  products: any;
  total: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="lg:hidden max-w-full">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 hover:border-slate-500/60 transition-all"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-sm text-slate-300">
            {items.length} {items.length === 1 ? "producto" : "productos"}
          </span>
          <span className="text-sm font-semibold text-white ml-2">
            <Price amount={total} convertToArs />
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
        <div className="mt-2 p-4 bg-slate-900/30 rounded-xl space-y-2 animate-fadeIn border border-slate-700/40 max-h-64 overflow-y-auto">
          {items.map((item: any) => {
            const product = products[item.productId];
            return product ? (
              <div key={item.productId} className="flex gap-2 text-sm">
                <span className="text-slate-400 break-words min-w-0">{cleanProductName(product.name)} x{item.quantity}</span>
                <span className="text-slate-200 shrink-0 whitespace-nowrap"><Price amount={product.price * item.quantity} convertToArs /></span>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Trust Badges ─────────────────────────────────────────────────────────────

function TrustBadges() {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 py-4 text-slate-500">
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs">Datos protegidos</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-xs">Compra segura</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span className="text-xs">Pago seguro</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface CheckoutFormProps {
  items: any[];
  products: Record<string, any>;
  total: number;
  onSubmit: (data: CheckoutFormData) => void;
  isLoading?: boolean;
}

export function CheckoutForm({ items, products, total, onSubmit, isLoading }: CheckoutFormProps) {
  const [showApartmentFields, setShowApartmentFields] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
    defaultValues: {
      livesInApartment: false,
      saveAddress: true,
      sameForBilling: true,
      additionalInstructions: "",
    },
  });

  const livesInApartment = watch("livesInApartment");

  // Sync to local state for animation
  useEffect(() => {
    setShowApartmentFields(livesInApartment);
  }, [livesInApartment]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: Contact Info
         ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          number="1"
          title="Información de contacto"
          description="Te vamos a enviar la confirmación acá"
        />

        <div className="space-y-4 pl-0 sm:pl-12">
          {/* Name + Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Nombre"
              placeholder="Ej: Juan"
              autoComplete="given-name"
              error={errors.name?.message}
              {...register("name")}
            />
            <FormField
              label="Apellido"
              placeholder="Ej: Pérez"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Correo electrónico"
              type="email"
              placeholder="Ej: juan@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormField
              label="Teléfono"
              type="tel"
              placeholder="Ej: 11 2345 6789"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: Delivery Address
         ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          number="2"
          title="Dirección de entrega"
          description="Donde querés recibir tu pedido"
        />

        <div className="space-y-4 pl-0 sm:pl-12">
          {/* Street + Number */}
          <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-4">
            <FormField
              label="Calle"
              placeholder="Ej: Av. San Martín"
              autoComplete="street-address"
              error={errors.street?.message}
              {...register("street")}
            />
            <FormField
              label="Número"
              placeholder="Ej: 1250"
              autoComplete="address-line2"
              error={errors.number?.message}
              {...register("number")}
            />
          </div>

          {/* Apartment toggle */}
          <ToggleField
            label="Vivo en departamento"
            description="Mostrar piso, departamento y torre"
            {...register("livesInApartment")}
          />

          {/* Dynamic apartment fields */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-hidden transition-all duration-300 ${
              showApartmentFields
                ? "max-h-40 opacity-100 mt-0"
                : "max-h-0 opacity-0 -mt-2 pointer-events-none"
            }`}
            aria-hidden={!showApartmentFields}
          >
            <FormField
              label="Piso"
              placeholder="Ej: 3"
              error={errors.floor?.message}
              {...register("floor")}
            />
            <FormField
              label="Departamento"
              placeholder="Ej: B, 3A, PB"
              error={errors.apartment?.message}
              {...register("apartment")}
            />
            <FormField
              label="Torre / Bloque"
              optional
              placeholder="Ej: Torre 2"
              error={errors.tower?.message}
              {...register("tower")}
            />
          </div>

          {/* Province */}
          <SelectField
            label="Provincia"
            options={PROVINCIAS}
            placeholder="Seleccioná una provincia"
            error={errors.province?.message}
            {...register("province")}
          />

          {/* City + Postal Code */}
          <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-4">
            <FormField
              label="Ciudad"
              placeholder="Ej: General Roca"
              autoComplete="address-level2"
              error={errors.city?.message}
              {...register("city")}
            />
            <FormField
              label="Código postal"
              placeholder="Ej: 8332"
              autoComplete="postal-code"
              error={errors.postalCode?.message}
              {...register("postalCode")}
            />
          </div>

          {/* Additional Instructions */}
          <FormField
            label="Indicaciones adicionales"
            optional
            placeholder="Ej: Casa blanca con portón negro, timbre roto, entregar después de las 18 hs."
            rows={3}
            autoComplete="off"
            error={errors.additionalInstructions?.message}
            {...register("additionalInstructions")}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: Preferences
         ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          number="3"
          title="Preferencias"
          description="Opciones adicionales para tu compra"
        />

        <div className="space-y-4 pl-0 sm:pl-12">
          <CheckboxField
            label="Guardar esta dirección para futuras compras"
            description="No vas a tener que escribirla de nuevo"
            {...register("saveAddress")}
          />
          <CheckboxField
            label="Usar misma dirección para facturación"
            description="La factura se emitirá con estos datos"
            {...register("sameForBilling")}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA + Trust
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={!isValid || isLoading}
          className="w-full h-12 text-base font-semibold rounded-xl bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-all disabled:opacity-40"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Procesando...
            </span>
          ) : (
            "Continuar al pago"
          )}
        </Button>

        <TrustBadges />
      </div>

    </form>
  );
}

export type { CheckoutFormData };
