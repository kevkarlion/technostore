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

    console.log("[MP Cancel] Cancelling order:", order_id);

    const response = await fetch(`https://api.mercadopago.com/v1/orders/${order_id}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `cancel-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
    });

    const responseText = await response.text();
    console.log("[MP Cancel] Response status:", response.status);
    console.log("[MP Cancel] Response body:", responseText);

    let cancelResult: Record<string, unknown>;
    try {
      cancelResult = JSON.parse(responseText);
    } catch {
      cancelResult = { raw_body: responseText };
    }

    if (response.status !== 200 && response.status !== 201) {
      const cause = cancelResult.cause as Array<{ code?: string; description?: string }> | undefined;
      const mpMessage =
        cancelResult.message ||
        cancelResult.error ||
        cancelResult.error_description ||
        cause?.[0]?.description ||
        JSON.stringify(cancelResult);
      return NextResponse.json(
        { message: mpMessage, details: cancelResult },
        { status: response.status }
      );
    }

    return NextResponse.json(cancelResult);
  } catch (error) {
    console.error("[MP Cancel] Error:", error);
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    );
  }
}