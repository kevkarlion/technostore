import { NextRequest, NextResponse } from "next/server";

interface OrderRequest {
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification: {
      type: string;
      number: string;
    };
  };
  externalReference?: string;
  items?: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
  paymentMethodId?: string;
  token?: string;
  installments?: number;
  total_amount?: string;
  transactions?: {
    payments: Array<{
      amount: string;
      payment_method: {
        id: string;
        type: string;
        token?: string;
        installments?: number;
      };
    }>;
  };
}

interface ErrorResponse {
  message: string;
  details?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OrderRequest;
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json<ErrorResponse>(
        { message: "Mercado Pago no configurado" },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!body.payer?.email) {
      return NextResponse.json<ErrorResponse>(
        { message: "Email del pagador requerido" },
        { status: 400 }
      );
    }

    // Calculate totalAmount - from direct amount or from items
    let totalAmount = 0;
    if (typeof body.total_amount === 'number') {
      totalAmount = body.total_amount;
      console.log("[MP Order] total_amount (number):", body.total_amount);
    } else if (body.total_amount) {
      totalAmount = parseFloat(body.total_amount);
      console.log("[MP Order] total_amount (string):", body.total_amount);
    } else if (body.items) {
      totalAmount = body.items.reduce(
        (acc, item) => acc + item.unit_price * item.quantity,
        0
      );
      console.log("[MP Order] total_amount from items:", totalAmount);
    } else if (body.transactions?.payments?.[0]?.amount) {
      totalAmount = typeof body.transactions.payments[0].amount === 'number' 
        ? body.transactions.payments[0].amount
        : parseFloat(body.transactions.payments[0].amount);
    }
    
    // Validate minimum amount per Mercado Pago requirements
    if (totalAmount < 0.50) {
      return NextResponse.json<ErrorResponse>(
        { message: "El monto mínimo es de $0.50" },
        { status: 400 }
      );
    }
    
    console.log("[MP Order] Final totalAmount:", totalAmount);

    // If still no amount, fail
    if (totalAmount <= 0) {
      return NextResponse.json<ErrorResponse>(
        { message: "Monto inválido" },
        { status: 400 }
      );
    }

    // Determine payment method - can come from body.paymentMethodId or from transactions
    const paymentMethodId = body.paymentMethodId || body.transactions?.payments?.[0]?.payment_method?.id;
    if (!paymentMethodId) {
      return NextResponse.json<ErrorResponse>(
        { message: "Método de pago requerido" },
        { status: 400 }
      );
    }

    // Determine payment method type - if it's a known card, use credit_card, otherwise ticket
    const cardPaymentMethods = ["visa", "master", "amex", "elo", "hipercard", "carnet"];
    const isCard = cardPaymentMethods.some(pm => 
      paymentMethodId.toLowerCase().includes(pm.toLowerCase())
    );
    const paymentMethodType = isCard ? "credit_card" : "ticket";
    
    // Get token from body or from transactions
    const token = body.token || body.transactions?.payments?.[0]?.payment_method?.token;
    const installments = body.installments || body.transactions?.payments?.[0]?.payment_method?.installments || 1;

    // Create order with reserve (capture_mode: manual)
    const orderData = {
      capture_mode: "manual", // Reserve funds, don't charge yet
      type: "online",
      external_reference: body.externalReference || `ORD-${Date.now()}`,
      processing_mode: "automatic",
      marketplace: "NONE",
      total_amount: totalAmount.toFixed(2),
      payer: {
        email: body.payer.email,
        first_name: body.payer.first_name || "Cliente",
        last_name: body.payer.last_name || "",
        identification: body.payer.identification || {
          type: "DNI",
          number: "00000000",
        },
      },
      transactions: {
        payments: [
          {
            amount: totalAmount.toFixed(2),
            payment_method: {
              id: paymentMethodId || "visa",
              type: "credit_card",
              token: token || "",
              installments: installments || 1,
            },
          },
        ],
      },
    };

    console.log("[MP Order] Token received:", token);
    console.log("[MP Order] Payment method ID:", paymentMethodId);
    console.log("[MP Order] Installments:", installments);
    console.log("[MP Order] Creating order with reserve:", JSON.stringify(orderData, null, 2));

    const response = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `ord-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify(orderData),
    });

    const orderResult = await response.json();
    console.log("[MP Order] Response status:", response.status);
    console.log("[MP Order] Response body:", JSON.stringify(orderResult, null, 2));

    if (response.status !== 200 && response.status !== 201) {
      console.log("[MP Order] Error response:", JSON.stringify(orderResult, null, 2));
      
      // Try to extract the specific error from various possible structures
      let errorMessage = "Error al crear la orden";
      
      // Direct errors array
      if (orderResult.errors) {
        errorMessage = orderResult.errors.map((e: any) => e.details || e.message).join(", ");
      }
      // Data object (for order failures)
      else if (orderResult.data?.transactions?.payments?.[0]) {
        const payment = orderResult.data.transactions.payments[0];
        errorMessage = `Pago rechazado: ${payment.status_detail || payment.status}`;
      }
      // Direct message
      else if (orderResult.message) {
        errorMessage = orderResult.message;
      }
      
      console.log("[MP Order] Extracted error:", errorMessage);
      
      return NextResponse.json<ErrorResponse>(
        { message: errorMessage, details: orderResult },
        { status: response.status }
      );
    }

    // Return order result - status will be "action_required" with "waiting_capture"
    return NextResponse.json(orderResult, { status: 201 });
  } catch (error) {
    console.error("[MP Order] Error:", error);
    return NextResponse.json<ErrorResponse>(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}