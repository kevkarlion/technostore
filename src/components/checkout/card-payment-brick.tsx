"use client";

import { useEffect, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";

interface CardPaymentBrickProps {
  initialAmount: number;
  customerEmail: string;
  onPaymentSuccess: (data: any) => void;
  onPaymentError: (error: string) => void;
}

export function CardPaymentBrick({ 
  initialAmount, 
  customerEmail, 
  onPaymentSuccess, 
  onPaymentError 
}: CardPaymentBrickProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initMercadoPago("APP_USR-b17e9b0b-1892-44c1-a944-dfc4e67aa7c9");
        setReady(true);
      } catch (e) {
        console.error("[MP] Init error:", e);
        setError("Error al inicializar Mercado Pago");
      }
    };
    init();
  }, []);

  const onSubmit = async (formData: any, additionalData: any): Promise<void> => {
    // The Brick handles everything internally
    console.log("[MP Brick] Payment submitted:", formData);
  };

  const onReady = () => {
    console.log("[MP Brick] Ready!");
  };

  const onError = (err: any) => {
    console.error("[MP Brick] Error:", err);
    console.error("[MP Brick] Error JSON:", JSON.stringify(err, null, 2));
    
    const errorMsg = 
      err?.message || 
      err?.cause?.message ||
      JSON.stringify(err);
    setError(errorMsg);
    onPaymentError(errorMsg);
  };

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-slate-400">Inicializando pago...</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <CardPayment
        initialization={{
          amount: initialAmount,
          payer: {
            email: customerEmail || "test@testuser.com",
          },
        }}
        onSubmit={onSubmit}
        onReady={onReady}
        onError={onError}
        customization={{
          theme: "dark",
        }}
      />
    </div>
  );
}
