"use client";

import { useEffect, useRef, useState } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { Price } from "@/components/ui/price";
import { formatAndTranslateError } from "@/lib/mp-errors";

type PaymentMethodType = "card";

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

// ─── Card Brand SVGs ─────────────────────────────────────────────────────────
// SVGs inline con forma de tarjeta, colores oficiales de cada red

const brandColors = {
  visa:        { bg: "#1A1F71", fg: "#F7B600" },
  mastercard:  { bg: "#FFFFFF", fg: "#000000" },
  amex:        { bg: "#016FD0", fg: "#FFFFFF" },
  naranja:     { bg: "#FF6B00", fg: "#FFFFFF" },
  cabal:       { bg: "#006847", fg: "#FFFFFF" },
  maestro:     { bg: "#FFFFFF", fg: "#0066CB" },
  diners:      { bg: "#004EA2", fg: "#FFFFFF" },
  discover:    { bg: "#F48024", fg: "#FFFFFF" },
};

type BrandKey = keyof typeof brandColors;

const CardBrands: Record<BrandKey, () => React.ReactNode> = {
  visa: () => (
    <svg viewBox="0 0 36 24" className="h-6 w-9 rounded" role="img" aria-label="Visa">
      <rect width="36" height="24" rx="3" fill="#1A1F71" />
      <text x="18" y="17" textAnchor="middle" fill="#F7B600"
            fontFamily="Arial, sans-serif" fontWeight="800" fontSize="11">VISA</text>
    </svg>
  ),

  mastercard: () => (
    <svg viewBox="0 0 36 24" className="h-6 w-9" role="img" aria-label="Mastercard">
      <rect width="36" height="24" rx="3" fill="#FFFFFF" />
      <circle cx="13" cy="12" r="7.5" fill="#EB001B" />
      <circle cx="23" cy="12" r="7.5" fill="#F79E1B" opacity="0.9" />
    </svg>
  ),

  amex: () => (
    <svg viewBox="0 0 36 24" className="h-6 w-9" role="img" aria-label="American Express">
      <rect width="36" height="24" rx="3" fill="#016FD0" />
      <text x="18" y="16" textAnchor="middle" fill="#FFFFFF"
            fontFamily="Arial, sans-serif" fontWeight="700" fontSize="7.5"
            letterSpacing="0.3">AMEX</text>
    </svg>
  ),

  naranja: () => (
    <svg viewBox="0 0 36 24" className="h-6 w-9" role="img" aria-label="Naranja">
      <rect width="36" height="24" rx="3" fill="#FF6B00" />
      <circle cx="18" cy="12" r="6.5" fill="#FFFFFF" />
      <text x="18" y="16" textAnchor="middle" fill="#FF6B00"
            fontFamily="Arial, sans-serif" fontWeight="800" fontSize="11">N</text>
    </svg>
  ),

  cabal: () => (
    <svg viewBox="0 0 36 24" className="h-6 w-9" role="img" aria-label="Cabal">
      <rect width="36" height="24" rx="3" fill="#006847" />
      <text x="18" y="17" textAnchor="middle" fill="#FFFFFF"
            fontFamily="Arial, sans-serif" fontWeight="700" fontSize="7.5"
            letterSpacing="0.8">CABAL</text>
    </svg>
  ),

  maestro: () => (
    <svg viewBox="0 0 36 24" className="h-6 w-9" role="img" aria-label="Maestro">
      <rect width="36" height="24" rx="3" fill="#FFFFFF" />
      <circle cx="13" cy="12" r="7.5" fill="#0066CB" />
      <circle cx="23" cy="12" r="7.5" fill="#CC0000" opacity="0.75" />
    </svg>
  ),

  diners: () => (
    <svg viewBox="0 0 36 24" className="h-6 w-9" role="img" aria-label="Diners Club">
      <rect width="36" height="24" rx="3" fill="#004EA2" />
      <text x="18" y="16" textAnchor="middle" fill="#FFFFFF"
            fontFamily="Arial, sans-serif" fontWeight="700" fontSize="6"
            letterSpacing="0.5">DINERS</text>
    </svg>
  ),

  discover: () => (
    <svg viewBox="0 0 36 24" className="h-6 w-9" role="img" aria-label="Discover">
      <defs>
        <linearGradient id="ds-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F48024" />
          <stop offset="100%" stopColor="#E66316" />
        </linearGradient>
      </defs>
      <rect width="36" height="24" rx="3" fill="url(#ds-grad)" />
      <text x="18" y="17" textAnchor="middle" fill="#FFFFFF"
            fontFamily="Arial, sans-serif" fontWeight="700" fontSize="6"
            letterSpacing="0.3">DISCOVER</text>
    </svg>
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

  // Determine card brand from number — usa el resultado del SDK de MP (BIN real)
  // cuando está disponible, y cae a detección básica por dígito inicial si no.
  const cardBrand: BrandKey | null = (() => {
    // 1. Si MP ya identificó la tarjeta via BIN, usar eso (más preciso)
    if (selectedPaymentMethodId in brandColors) return selectedPaymentMethodId as BrandKey;

    // 2. Fallback: detección por primer dígito / BIN básico mientras el SDK responde
    const num = cardNumber.replace(/\s/g, "");
    if (!num) return null;

    const bin = num.slice(0, 6);

    // BIN ranges locales + internacionales
    if (/^4[0-9]{5}/.test(bin) && !/^401425|^434886/.test(bin)) return "visa";
    if (/^5[1-5]/.test(num) || /^222[1-9]|^22[3-9]|^2[3-6]|^27[01]|^2720/.test(bin)) return "mastercard";
    if (/^3[47]/.test(num)) return "amex";
    if (/^401425|^434886|^539461|^542486|^549[0-9]{3}|^589[0-9]{3}/.test(bin)) return "naranja";
    if (/^589657|^603488|^60420[12]|^6054[0-9]{2}/.test(bin)) return "cabal";
    if (/^5018|^5020|^5038|^5893|^6304|^6759|^676[1-3]/.test(bin)) return "maestro";
    if (/^3(?:0[0-5]|[68]|9)/.test(num)) return "diners";
    if (/^6011|^65|^64[4-9]|^6221[2-9]|^622[2-8]|^6229[0-2]/.test(bin)) return "discover";

    return null;
  })();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#009EE3]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - MP Style */}
      <div className="bg-gradient-to-r from-[#009EE3] to-[#00B3F0] rounded-xl p-3.5 text-white">
        <div className="flex items-center gap-2 mb-0.5">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span className="font-semibold text-base">Pagar</span>
        </div>
        <div className="text-white/80 text-xs">Total a pagar</div>
        <div className="text-xl font-bold"><Price amount={totalAmount} currency="ARS" /></div>
      </div>

      {/* Payment Method Selection - MP Tabs */}
      <div className="border-b border-slate-700">
        <div className="flex">
          <button
            type="button"
            onClick={() => setPaymentMethodType("card")}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              paymentMethodType === "card"
                ? "border-[#009EE3] text-[#009EE3]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            💳 Tarjeta
          </button>
        </div>
      </div>

      {/* Card Form - MP Style */}
      {paymentMethodType === "card" && (
        <form onSubmit={handleSubmit} className="space-y-3" autoComplete="on">
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
                className="w-full px-3.5 py-2.5 pr-14 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
              />
              {/* Card brand icon */}
              {cardBrand && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  {CardBrands[cardBrand]()}
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
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors uppercase"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
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
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
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
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#009EE3] focus:ring-1 focus:ring-[#009EE3] transition-colors"
              />
            </div>
          </div>

          {/* Error message */}
          {cardError && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {cardError}
            </div>
          )}

          {/* Submit Button - MP Blue */}
          <button
            type="submit"
            className="w-full bg-[#009EE3] hover:bg-[#00B3F0] text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-[#009EE3]/20"
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
    </div>
  );
}