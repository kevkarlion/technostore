import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id } = body;
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Mercado Pago no configurado" },
        { status: 500 }
      );
    }

    if (!order_id) {
      return NextResponse.json(
        { message: "Order ID requerido" },
        { status: 400 }
      );
    }

    console.log("[MP Capture] Capturing order:", order_id);

    const response = await fetch(`https://api.mercadopago.com/v1/orders/${order_id}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `cap-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
    });

    const captureResult = await response.json();
    console.log("[MP Capture] Response:", response.status, JSON.stringify(captureResult, null, 2));

    if (response.status !== 200 && response.status !== 201) {
      return NextResponse.json(
        { message: captureResult.message || "Error al capturar" },
        { status: response.status }
      );
    }

    return NextResponse.json(captureResult);
  } catch (error) {
    console.error("[MP Capture] Error:", error);
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    );
  }
}