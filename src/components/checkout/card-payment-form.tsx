"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { formatAndTranslateError } from "@/lib/mp-errors";

interface CardPaymentFormProps {
  amount: number;
  customerEmail: string;
  onPaymentSuccess: (data: { orderId: string; paymentId: string; status: string }) => void;
  onPaymentError: (error: string) => void;
}

export function CardPaymentForm({ amount, customerEmail, onPaymentSuccess, onPaymentError }: CardPaymentFormProps) {
  const [isReady, setIsReady] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const mpRef = useRef<any>(null);
  const cardNumberRef = useRef<HTMLDivElement>(null);
  const expirationDateRef = useRef<HTMLDivElement>(null);
  const securityCodeRef = useRef<HTMLDivElement>(null);
  
  const cardNumberElement = useRef<any>(null);
  const expirationDateElement = useRef<any>(null);
  const securityCodeElement = useRef<any>(null);

  // References for form fields
  const cardholderNameRef = useRef<HTMLInputElement>(null);
  const issuerSelectRef = useRef<HTMLSelectElement>(null);
  const installmentsSelectRef = useRef<HTMLSelectElement>(null);
  const identificationTypeSelectRef = useRef<HTMLSelectElement>(null);
  const identificationNumberRef = useRef<HTMLInputElement>(null);
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const paymentMethodIdInputRef = useRef<HTMLInputElement>(null);

  const identificationTypesRef = useRef<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        await loadMercadoPago();
        const mp = (window as any).MercadoPago;
        mpRef.current = new mp("APP_USR-b17e9b0b-1892-44c1-a944-dfc4e67aa7c9");
        
        // Get identification types
        const idTypes = await mpRef.current.getIdentificationTypes();
        identificationTypesRef.current = idTypes || [];
        
        // Create select options for identification types
        if (identificationTypeSelectRef.current && idTypes) {
          identificationTypeSelectRef.current.innerHTML = "";
          idTypes.forEach((type: any) => {
            const option = document.createElement("option");
            option.value = type.id;
            option.textContent = type.name;
            identificationTypeSelectRef.current?.appendChild(option);
          });
        }

        // Initialize secure fields
        cardNumberElement.current = mpRef.current.fields.create("cardNumber", {
          placeholder: "Número de tarjeta",
        }).mount(cardNumberRef.current);

        expirationDateElement.current = mpRef.current.fields.create("expirationDate", {
          placeholder: "MM/YY",
        }).mount(expirationDateRef.current);

        securityCodeElement.current = mpRef.current.fields.create("securityCode", {
          placeholder: "Código de seguridad",
        }).mount(securityCodeRef.current);

        // Handle BIN change
        cardNumberElement.current.on("binChange", async (data: any) => {
          const { bin } = data;
          if (bin && bin.length >= 6) {
            try {
              const pmResponse = await mpRef.current.getPaymentMethods({ bin });
              const pm = pmResponse.results[0];
              
              if (pm && paymentMethodIdInputRef.current) {
                paymentMethodIdInputRef.current.value = pm.id;
              }

              // Get installments
              const installmentsResponse = await mpRef.current.getInstallments({
                amount: amount,
                bin: bin,
                paymentTypeId: "credit_card",
              });
              
              if (installmentsResponse && installmentsSelectRef.current) {
                setInstallments(installmentsResponse[0]?.payer_costs || []);
                
                // Clear and add options
                installmentsSelectRef.current.innerHTML = "";
                installmentsResponse[0]?.payer_costs?.forEach((cost: any) => {
                  const option = document.createElement("option");
                  option.value = cost.installments;
                  option.textContent = cost.recommended_message;
                  installmentsSelectRef.current?.appendChild(option);
                });
              }
            } catch (e) {
              console.error("Error getting payment info:", e);
            }
          }
        });

        setIsReady(true);
      } catch (e) {
        console.error("Error initializing:", e);
        setError("Error al inicializar Mercado Pago");
      }
    };

    init();
  }, [amount]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cardNumberElement.current || !expirationDateElement.current || !securityCodeElement.current) {
      setError("Los campos de tarjeta no están listos");
      return;
    }

    try {
      // Create card token
      const token = await mpRef.current.fields.createCardToken({
        cardholderName: cardholderNameRef.current?.value || "",
        identificationType: identificationTypeSelectRef.current?.value || "DNI",
        identificationNumber: identificationNumberRef.current?.value || "",
      });

      if (!token.id) {
        setError("Error al crear token de tarjeta");
        return;
      }

      if (tokenInputRef.current) {
        tokenInputRef.current.value = token.id;
      }

      // Build payment data
      const paymentData = {
        type: "online",
        processing_mode: "automatic",
        total_amount: amount.toFixed(2),
        external_reference: `ORD-${Date.now()}`,
        payer: {
          email: customerEmail || (process.env.NEXT_PUBLIC_MP_ENV === 'sandbox' ? "test@testuser.com" : "cliente@placeholder.com"),
          first_name: "Cliente",
          last_name: "Test",
          identification: {
            type: identificationTypeSelectRef.current?.value || "DNI",
            number: identificationNumberRef.current?.value || "12345678",
          },
        },
        transactions: {
          payments: [
            {
              amount: amount.toFixed(2),
              payment_method: {
                id: paymentMethodIdInputRef.current?.value || "visa",
                type: "credit_card",
                token: token.id,
                installments: Number(installmentsSelectRef.current?.value) || 1,
              },
            },
          ],
        },
      };

      console.log("[MP] Creating order:", JSON.stringify(paymentData, null, 2));

      const response = await fetch("/api/mercadopago/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      console.log("[MP] Order result:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error((result as any).message || "Error en el pago");
      }

      if (result.status === "processed" || result.status === "approved") {
        onPaymentSuccess({
          orderId: result.id,
          paymentId: result.transactions?.payments?.[0]?.id,
          status: result.status,
        });
      } else {
        throw new Error(result.status_detail || "Pago no aprobado");
      }
    } catch (err: any) {
      console.error("[MP] Payment error:", err);
      const userMsg = formatAndTranslateError(err);
      setError(userMsg);
      onPaymentError(userMsg);
    }
  }, [amount, customerEmail, onPaymentSuccess, onPaymentError]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" ref={tokenInputRef} name="token" />
      <input type="hidden" ref={paymentMethodIdInputRef} name="paymentMethodId" />
      
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Número de tarjeta</label>
        <div ref={cardNumberRef} className="p-2 bg-slate-900 border border-slate-700 rounded-lg min-h-[40px]"></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Vencimiento</label>
          <div ref={expirationDateRef} className="p-2 bg-slate-900 border border-slate-700 rounded-lg min-h-[40px]"></div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">CVV</label>
          <div ref={securityCodeRef} className="p-2 bg-slate-900 border border-slate-700 rounded-lg min-h-[40px]"></div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Titular de la tarjeta</label>
        <input
          ref={cardholderNameRef}
          type="text"
          placeholder="Como aparece en la tarjeta"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Banco emisor</label>
          <select
            ref={issuerSelectRef}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">Seleccionar banco</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Cuotas</label>
          <select
            ref={installmentsSelectRef}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="1">1 cuota</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de documento</label>
          <select
            ref={identificationTypeSelectRef}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">Cargando...</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Número de documento</label>
          <input
            ref={identificationNumberRef}
            type="text"
            placeholder="12345678"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-400">{error}</p>
      )}

      <button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors"
      >
        Pagar ${amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
      </button>
    </form>
  );
}