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
      },
    });

    const cancelResult = await response.json();
    console.log("[MP Cancel] Response:", response.status, JSON.stringify(cancelResult, null, 2));

    if (response.status !== 200 && response.status !== 201) {
      // MP puede devolver error en message, error, o cause[0].description
      const mpMessage =
        cancelResult.message ||
        cancelResult.error ||
        cancelResult.cause?.[0]?.description ||
        `Error MP (status ${response.status})`;
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