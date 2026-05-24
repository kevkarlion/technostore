"use client";

import { useEffect, useRef, useState } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { Price } from "@/components/ui/price";
import { formatAndTranslateError } from "@/lib/mp-errors";

type PaymentMethodType = "card" | "rapipago" | "pagofacil";

interface MercadoPagoFormProps {
  onPaymentSubmit: (data: {
    type: PaymentMethodType;
    token?: string;
    paymentMethodId?: string;
    paymentTypeId?: string;
    installments?: number;
    payer: {
      email: string;
      identification: { type: string; number: string };
    };
  }) => void;
  customerEmail: string;
  totalAmount: number;
  onError: (error: string) => void;
}

// Card brand logos — ultra-simple, guaranteed to render
const CardBrands = {
  visa: () => (
    <div className="flex items-center justify-center h-6 w-9 rounded bg-[#1A1F71] text-[10px] font-bold text-[#F7B600] leading-none px-1">
      VISA
    </div>
  ),
  mastercard: () => (
    <div className="flex items-center justify-center h-6 w-9 rounded bg-white relative">
      <span className="absolute left-[6px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-[#EB001B]" />
      <span className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-[#FF5F00]" />
    </div>
  ),
  amex: () => (
    <div className="flex items-center justify-center h-6 w-9 rounded bg-[#016FD0] text-[8px] font-bold text-white leading-none px-1">
      AMEX
    </div>
  ),
};

export function MercadoPagoForm({ onPaymentSubmit, customerEmail, totalAmount, onError }: MercadoPagoFormProps) {
  const cardHolderRef = useRef<HTMLInputElement>(null);
  const docNumberRef = useRef<HTMLInputElement>(null);
  const docTypeRef = useRef<HTMLSelectElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvc] = useState("");
  const [cardError, setCardError] = useState("");
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodType>("card");
  const [identificationTypes, setIdentificationTypes] = useState<{ id: string; name: string }[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
  const [paymentTypeId, setPaymentTypeId] = useState<string>("");
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const mpRef = useRef<any>(null);

  useEffect(() => {
    const initMP = async () => {
      try {
        await loadMercadoPago();
        const mp = (window as any).MercadoPago;
        if (!mp) {
          onError("Error al cargar Mercado Pago");
          return;
        }
        mpRef.current = new mp(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY);
        
        try {
          const idTypes = await mpRef.current.getIdentificationTypes();
          setIdentificationTypes(idTypes || []);
        } catch (e) {
          // Fallback
        }
        setIsReady(true);
      } catch (e) {
        setIsReady(true);
      }
    };
    initMP();
  }, [onError]);

  // Get payment method and installments
  useEffect(() => {
    const getPaymentMethodAndInstallments = async () => {
      const cardNumberClean = cardNumber.replace(/\s/g, "");
      if (cardNumberClean.length < 6 || !mpRef.current) {
        setSelectedPaymentMethodId("");
        setInstallmentsList([]);
        return;
      }
      
      setIsLoadingInstallments(true);
      try {
        const bin = cardNumberClean.substring(0, 6);
        const pmResponse = await mpRef.current.getPaymentMethods({ bin });
        
        if (pmResponse.results && pmResponse.results.length > 0) {
          const pm = pmResponse.results[0];
          setSelectedPaymentMethodId(pm.id);
          setPaymentTypeId(pm.payment_type_id);
          
          // Only credit cards support installments — force 1 cuota for debit/prepaid
          if (pm.payment_type_id !== "credit_card") {
            setInstallmentsList([]);
            setSelectedInstallments(1);
            setIsLoadingInstallments(false);
            return;
          }
          
          try {
            console.log("[MP] Getting installments with:", { bin, amount: totalAmount, paymentTypeId: pm.payment_type_id });
            const installmentsResponse = await mpRef.current.getInstallments({
              amount: String(totalAmount),
              bin,
              paymentTypeId: pm.payment_type_id,
            });
            console.log("[MP] Installments response:", installmentsResponse);
            
            if (installmentsResponse && installmentsResponse.length > 0) {
              const payerCosts = installmentsResponse[0]?.payer_costs || [];
              if (payerCosts.length > 0) {
                setInstallmentsList(payerCosts);
                setSelectedInstallments(payerCosts[0].installments);
                setIsLoadingInstallments(false);
                return;
              }
            }
          } catch (err) {
            // Ignore installments error
          }
        }
        setInstallmentsList([]);
      } catch (err) {
        setInstallmentsList([]);
      } finally {
        setIsLoadingInstallments(false);
      }
    };

    const timeout = setTimeout(getPaymentMethodAndInstallments, 500);
    return () => clearTimeout(timeout);
  }, [cardNumber, totalAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError("");

    if (!mpRef.current) {
      setCardError("Mercado Pago no está listo");
      return;
    }

    try {
      const cardNumberClean = cardNumber.replace(/\s/g, "");
      const [expMonth, expYear] = expiry.split("/");
      
      const cardData = {
        cardNumber: cardNumberClean,
        cardholderName: cardHolderRef.current?.value || "",
        cardExpirationMonth: String(parseInt(expMonth || "0")).padStart(2, "0"),
        cardExpirationYear: String(parseInt("20" + (expYear || "25"))),
        securityCode: cvv,
        identificationType: docTypeRef.current?.value || "DNI",
        identificationNumber: docNumberRef.current?.value || "",
      };

      const token = await mpRef.current.createCardToken(cardData);
      
      if (token.id) {
        let paymentMethodId = selectedPaymentMethodId || "visa";
        onPaymentSubmit({
          type: "card",
          token: token.id,
          paymentMethodId,
          paymentTypeId,
          installments: selectedInstallments,
          payer: {
            email: customerEmail,
            identification: {
              type: docTypeRef.current?.value || "DNI",
              number: docNumberRef.current?.value || "",
            },
          },
        });
      } else {
        setCardError("Error al tokenizar la tarjeta. Verificá los datos.");
      }
    } catch (err: any) {
      const errorMsg = formatAndTranslateError(err?.message || "Error al procesar la tarjeta");
      setCardError(errorMsg);
    }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPaymentSubmit({
      type: paymentMethodType,
      payer: {
        email: customerEmail,
        identification: {
          type: docTypeRef.current?.value || "DNI",
          number: docNumberRef.current?.value || "",
        },
      },
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  // Determine card brand from number
  const getCardBrand = () => {
    const num = cardNumber.replace(/\s/g, "");
    if (num.startsWith("4")) return "visa";
    if (num.startsWith("5")) return "mastercard";
    if (num.startsWith("3")) return "amex";
    return null;
  };
  const cardBrand = getCardBrand();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#009EE3]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - MP Style */}
      <div className="bg-gradient-to-r from-[#009EE3] to-[#00B3F0] rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span className="font-semibold text-lg">Pagar</span>
        </div>
        <div className="text-white/80 text-sm">Total a pagar</div>
        <div className="text-2xl font-bold"><Price amount={totalAmount} /></div>
      </div>

      {/* Payment Method Selection - MP Tabs */}
      <div className="border-b border-slate-700">
        <div className="flex">
          <button
            type="button"
            onClick={() => setPaymentMethodType("card")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              paymentMethodType === "card"
                ? "border-[#009EE3] text-[#009EE3]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            💳 Tarjeta
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethodType("rapipago")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              paymentMethodType === "rapipago"
                ? "border-[#009EE3] text-[#009EE3]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            📄 Rapipago
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethodType("pagofacil")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              paymentMethodType === "pagofacil"
                ? "border-[#009EE3] text-[#009EE3]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            📄 Pago Fácil
          </button>
        </div>
      </div>

      {/* Card Form - MP Style */}
      {paymentMethodType === "card" && (
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          {/* Card Number - MP Style with icon */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Número de tarjeta
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                autoComplete="cc-number"
                className="w-full px-4 py-3 pr-14 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-base placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
              />
              {/* Card brand icon */}
              {cardBrand && CardBrands[cardBrand as keyof typeof CardBrands] && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  {CardBrands[cardBrand as keyof typeof CardBrands]()}
                </div>
              )}
            </div>
          </div>

          {/* Card Holder */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre del titular
            </label>
            <input
              ref={cardHolderRef}
              type="text"
              placeholder="Como aparece en la tarjeta"
              autoComplete="cc-name"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-base placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors uppercase"
            />
          </div>

          {/* Expiry and CVV - Side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Vencimiento
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/AA"
                maxLength={5}
                autoComplete="cc-exp"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-base placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Código de seguridad
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  autoComplete="cc-csc"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-base placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
                />
                {/* CVV hint icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Installments - MP Style */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Cuotas
            </label>
            {isLoadingInstallments ? (
              <div className="flex items-center gap-2 py-3 px-4 bg-slate-900/50 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#009EE3]"></div>
                <span className="text-sm text-slate-400">Cargando...</span>
              </div>
            ) : paymentTypeId && paymentTypeId !== "credit_card" ? (
              <div className="p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300">
                Pago único (1 cuota) — las tarjetas de débito y prepagas no permiten cuotas
              </div>
            ) : selectedPaymentMethodId ? (
              <select
                value={selectedInstallments}
                onChange={(e) => setSelectedInstallments(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-base focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
              >
                {installmentsList.length > 0 ? (
                  installmentsList.map((inst) => (
                    <option
                      key={inst.installments}
                      value={inst.installments}
                      className="bg-slate-900"
                    >
                      {inst.recommended_message || (
                        inst.installments === 1
                          ? `1 cuota — $${(inst.total_amount || totalAmount).toFixed(2)}`
                          : `${inst.installments} cuotas de $${inst.installment_amount?.toFixed(2)} — total $${(inst.total_amount || totalAmount).toFixed(2)}`
                      )}
                    </option>
                  ))
                ) : (
                  <option value={1} className="bg-slate-900">
                    1 cuota — ${totalAmount.toFixed(2)}
                  </option>
                )}
              </select>
            ) : (
              <div className="p-3 bg-slate-900/50 rounded-lg text-sm text-slate-400">
                Completá el número de tarjeta para ver las cuotas disponibles
              </div>
            )}
          </div>

          {/* Document - MP Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tipo de documento
              </label>
              <select
                ref={docTypeRef}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-base focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
              >
                {identificationTypes.length > 0 ? (
                  identificationTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))
                ) : (
                  <>
                    <option value="DNI">DNI</option>
                    <option value="CI">CI</option>
                    <option value="CUIT">CUIT</option>
                    <option value="CUIL">CUIL</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Número
              </label>
              <input
                ref={docNumberRef}
                type="text"
                placeholder="12345678"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-base placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
              />
            </div>
          </div>

          {/* Error message */}
          {cardError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {cardError}
            </div>
          )}

          {/* Submit Button - MP Blue */}
          <button
            type="submit"
            className="w-full bg-[#009EE3] hover:bg-[#00B3F0] text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-[#009EE3]/20"
          >
            Pagar
          </button>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Tus datos están protegidos con seguridad de Mercado Pago</span>
          </div>
        </form>
      )}

      {/* Ticket Form - MP Style */}
      {(paymentMethodType === "rapipago" || paymentMethodType === "pagofacil") && (
        <form onSubmit={handleTicketSubmit} className="space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#009EE3]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#009EE3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-200 font-medium">
                  {paymentMethodType === "rapipago" ? "Generar ticket Rapipago" : "Generar ticket Pago Fácil"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  El ticket tiene validez de 3 días. El pago se acreditará en 2 horas hábiles.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#009EE3] hover:bg-[#00B3F0] text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-[#009EE3]/20"
          >
            Continuar
          </button>
        </form>
      )}
    </div>
  );
}