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

    const responseText = await response.text();
    console.log("[MP Capture] Response status:", response.status);
    console.log("[MP Capture] Response body:", responseText);

    let captureResult: Record<string, unknown>;
    try {
      captureResult = JSON.parse(responseText);
    } catch {
      captureResult = { raw_body: responseText };
    }

    if (response.status !== 200 && response.status !== 201) {
      // MP puede devolver error en message, error, cause, o formato anidado
      const cause = captureResult.cause as Array<{ code?: string; description?: string }> | undefined;
      const mpMessage =
        captureResult.message ||
        captureResult.error ||
        captureResult.error_description ||
        cause?.[0]?.description ||
        JSON.stringify(captureResult);
      return NextResponse.json(
        { message: mpMessage, details: captureResult },
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