import { NextRequest, NextResponse } from "next/server";

interface PreferenceRequest {
  amount: number;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PreferenceRequest;
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Mercado Pago no configurado" },
        { status: 500 }
      );
    }

    // Create preference for Card Payment Brick
    const preferenceData = {
      items: [
        {
          title: "Orden de compra - TechnoStore",
          quantity: 1,
          unit_price: body.amount,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: body.email,
      },
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }],
        // Allow all installments
        installments: 12,
      },
      // Enable differentials for better installment handling
      differential_pricing: {
        id: 1,
      },
      external_reference: `ORD-${Date.now()}`,
      // Card Payment Brick needs these URLs for processing
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/pending`,
      },
    };

    console.log("[MP Preference] Creating:", JSON.stringify(preferenceData, null, 2));

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    const preferenceResult = await response.json();
    console.log("[MP Preference] Response:", response.status, JSON.stringify(preferenceResult, null, 2));

    if (response.status !== 200 && response.status !== 201) {
      return NextResponse.json(
        { message: preferenceResult.message || "Error al crear preferencia" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      preference_id: preferenceResult.id,
      init_point: preferenceResult.init_point,
      sandbox_init_point: preferenceResult.sandbox_init_point,
    });
  } catch (error) {
    console.error("[MP Preference] Error:", error);
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    );
  }
}