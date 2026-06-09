import { NextRequest, NextResponse } from "next/server";
import { createPreference } from "@/lib/mercadopago/client";
import type { MercadopagoPreferenceItem, MercadopagoPayer } from "@/types/mercadopago";
import { translateMpError } from "@/lib/mp-errors";

// ─── Request / Response types ─────────────────────────────────────────────

interface CreatePreferenceRequest {
  items: MercadopagoPreferenceItem[];
  payer: MercadopagoPayer;
  externalReference?: string;
}

interface SuccessResponse {
  preferenceId: string;
  initPoint: string;
}

interface ErrorResponse {
  message: string;
  details?: unknown;
}

// ─── Handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreatePreferenceRequest;
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const originUrl = req.nextUrl.origin;
    const baseUrl = envUrl ?? originUrl;
    
    console.log("[MP Preference] baseUrl:", { envUrl, originUrl, baseUrl });

    if (!baseUrl) {
      return NextResponse.json<ErrorResponse>(
        { message: "No se puede determinar la URL base" },
        { status: 500 }
      );
    }

    // ── Input validation ──────────────────────────────────────────────────
    if (!body.items || body.items.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { message: "La lista de artículos no puede estar vacía." },
        { status: 400 }
      );
    }

    for (const item of body.items) {
      if (!item.title || item.quantity <= 0 || item.unit_price <= 0) {
        return NextResponse.json<ErrorResponse>(
          {
            message:
              "Cada artículo debe tener título, cantidad mayor a 0 y precio mayor a 0.",
          },
          { status: 400 }
        );
      }
    }

    if (!body.payer?.email) {
      return NextResponse.json<ErrorResponse>(
        { message: "Datos del pagador (email) son requeridos." },
        { status: 400 }
      );
    }

    // ── Build Mercado Pago preference ───────────────────────────────────────
    const mpPayload = {
      items: body.items.map((item) => ({
        ...item,
        currency_id: item.currency_id ?? "ARS",
      })),
      payer: {
        name: body.payer.name,
        surname: body.payer.surname,
        email: body.payer.email,
        phone: body.payer.phone,
        address: body.payer.address,
        identification: body.payer.identification,
      },
      back_urls: {
        success: `${baseUrl}/checkout/success`,
        failure: `${baseUrl}/checkout/failure`,
        pending: `${baseUrl}/checkout/pending`,
      },
      external_reference: body.externalReference,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
    };

    console.log("[MP Preference] mpPayload:", JSON.stringify(mpPayload, null, 2));

    const mpResponse = await createPreference(mpPayload);

    const success: SuccessResponse = {
      preferenceId: mpResponse.id,
      initPoint: mpResponse.sandbox_init_point ?? mpResponse.init_point,
    };

    return NextResponse.json(success, { status: 201 });
  } catch (error: unknown) {
    console.error("[MP /create-preference] Error:", error);

    // Typed MP API errors from client.ts
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as { status: number }).status === "number"
    ) {
      const typedError = error as { status: number; message: string };
      if (typedError.status === 401 || typedError.status === 403) {
        return NextResponse.json<ErrorResponse>(
          { message: "Error de configuración. Contacta al administrador." },
          { status: 500 }
        );
      }
      return NextResponse.json<ErrorResponse>(
        { message: translateMpError(typedError.message) },
        { status: typedError.status }
      );
    }

    // Config / missing token
    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json<ErrorResponse>(
        { message: "Error de configuración. Contacta al administrador." },
        { status: 500 }
      );
    }

    const fallback = new Error("Error al procesar pago. Intenta nuevamente.");
    return NextResponse.json<ErrorResponse>(
      { message: fallback.message },
      { status: 500 }
    );
  }
}
