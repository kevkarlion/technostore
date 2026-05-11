/**
 * Mercado Pago REST API client.
 * Uses native fetch — no SDK dependency.
 */

import crypto from "crypto";
import type {
  MercadopagoPreferenceRequest,
  MercadopagoPreferenceResponse,
  MercadopagoWebhookPayload,
  MercadopagoApiError,
  MercadopagoPreferenceItem,
  MercadopagoPayer,
  MercadopagoBackUrls,
  MercadopagoPaymentTopic,
} from "@/types/mercadopago";

const MP_API_BASE = "https://api.mercadopago.com";

// ─── API Client ─────────────────────────────────────────────────────────────

async function mpRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
  }

  const url = `${MP_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as MercadopagoApiError;
    const message =
      body.message ||
      body.error ||
      `Mercado Pago API error ${res.status}`;
    throw Object.assign(new Error(message), {
      status: res.status,
      body,
    });
  }

  return res.json() as Promise<T>;
}

// ─── createPreference ───────────────────────────────────────────────────────

export async function createPreference(
  payload: MercadopagoPreferenceRequest
): Promise<MercadopagoPreferenceResponse> {
  return mpRequest<MercadopagoPreferenceResponse>(
    "/checkout/preferences",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

// ─── verifyWebhookSignature ─────────────────────────────────────────────────

/**
 * Verifies the x-signature header from Mercado Pago webhook.
 * MP sends: x-signature: ts=<timestamp>,v1=<hmac>
 * The HMAC is SHA256 of "<timestamp>.request_body" using WEBHOOK_SECRET.
 *
 * @param signature - raw x-signature header value
 * @param timestamp - raw x-signature timestamp header value (ts)
 * @param body - raw request body string (MUST be the exact bytes, not parsed)
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[MP Webhook] MERCADOPAGO_WEBHOOK_SECRET not configured — skipping verification");
    return true; // Fail open in dev; webhook route enforces config presence
  }

  // Parse v1=<hmac> from signature header
  const v1Match = signature.match(/v1=([a-f0-9]+)/i);
  if (!v1Match) return false;
  const receivedHmac = v1Match[1].toLowerCase();

  // Compute expected HMAC
  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(receivedHmac, "hex"),
    Buffer.from(expectedHmac, "hex")
  );
}

// ─── Types re-export for consumers ──────────────────────────────────────────

export type {
  MercadopagoPreferenceItem,
  MercadopagoPayer,
  MercadopagoBackUrls,
  MercadopagoPreferenceRequest,
  MercadopagoPreferenceResponse,
  MercadopagoWebhookPayload,
  MercadopagoPaymentTopic,
  MercadopagoApiError,
};
