import { NextRequest, NextResponse } from "next/server";
import { translateMpError } from "@/lib/mp-errors";

interface PaymentRequest {
  token: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  externalReference: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
  paymentMethodId: string;
}

interface ErrorResponse {
  message: string;
  details?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PaymentRequest;
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json<ErrorResponse>(
        { message: "Mercado Pago no configurado" },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!body.token) {
      return NextResponse.json<ErrorResponse>(
        { message: "Token de tarjeta requerido" },
        { status: 400 }
      );
    }

    if (!body.payer?.email) {
      return NextResponse.json<ErrorResponse>(
        { message: "Email del pagador requerido" },
        { status: 400 }
      );
    }

    // Calculate totals from items
    const transactionAmount = body.items.reduce(
      (acc, item) => acc + item.unit_price * item.quantity,
      0
    );

    // Create payment request to Mercado Pago
    const paymentData = {
      transaction_amount: transactionAmount,
      token: body.token,
      payer: {
        email: body.payer.email,
        identification: body.payer.identification || {
          type: "DNI",
          number: "00000000",
        },
      },
      external_reference: body.externalReference || `ORD-${Date.now()}`,
      payment_method_id: body.paymentMethodId || "visa", // Will be determined from card bin
      description: body.items.map((i) => i.title).join(", "),
      statement_descriptor: "TechnoStore",
    };

    console.log("[MP Payment] Creating payment:", JSON.stringify(paymentData, null, 2));

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paymentData),
    });

    const paymentResult = await response.json();

    console.log("[MP Payment] Response:", JSON.stringify(paymentResult, null, 2));

    if (response.status !== 201 && response.status !== 200) {
      const rawError =
        (paymentResult as any).message ||
        (paymentResult as any).error ||
        "Error al procesar el pago";
      const errorMessage = translateMpError(rawError);
      return NextResponse.json<ErrorResponse>(
        { message: errorMessage, details: paymentResult },
        { status: response.status }
      );
    }

    // Return payment result
    return NextResponse.json(paymentResult, { status: 201 });
  } catch (error) {
    console.error("[MP Payment] Error:", error);
    return NextResponse.json<ErrorResponse>(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}