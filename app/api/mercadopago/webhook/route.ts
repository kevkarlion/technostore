import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  type MercadopagoWebhookPayload,
} from "@/lib/mercadopago/client";

const WEBHOOK_LOG_PREFIX = "[MP Webhook]";

// ─── Handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Read raw body (needed for HMAC signature verification) ─────────────
    const rawBody = await req.text();

    const signature = req.headers.get("x-signature") ?? "";
    const timestamp = req.headers.get("x-signature-timestamp") ?? "";

    // ── Signature verification ─────────────────────────────────────────────
    if (signature || timestamp) {
      const isValid = verifyWebhookSignature(signature, timestamp, rawBody);
      if (!isValid) {
        console.warn(`${WEBHOOK_LOG_PREFIX} Invalid signature — rejecting request`);
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }
    } else {
      // If no signature headers are present, check whether secret is configured.
      // If it is configured and we have no signature, reject to enforce security.
      if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
        console.warn(`${WEBHOOK_LOG_PREFIX} Missing signature headers — rejecting request`);
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }
      // No secret configured → dev mode, allow without verification
      console.warn(`${WEBHOOK_LOG_PREFIX} No signature headers and no WEBHOOK_SECRET — dev mode allowed`);
    }

    // ── Parse payload ─────────────────────────────────────────────────────
    const payload = JSON.parse(rawBody) as MercadopagoWebhookPayload;

    console.log(`${WEBHOOK_LOG_PREFIX} Received:`, {
      type: payload.type,
      action: payload.action,
      paymentId: payload.data?.id,
      dateCreated: payload.date_created,
    });

    // ── Handle payment topics ──────────────────────────────────────────────
    if (payload.type === "payment") {
      const paymentId = payload.data?.id;
      const action = payload.action;

      if (!paymentId) {
        console.warn(`${WEBHOOK_LOG_PREFIX} Payment topic with no data.id — ignoring`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Log for audit — future: update order status in DB
      switch (action) {
        case "payment.created":
          console.log(`${WEBHOOK_LOG_PREFIX} Payment created: ${paymentId}`);
          break;
        case "payment.updated":
          console.log(`${WEBHOOK_LOG_PREFIX} Payment updated: ${paymentId}`);
          break;
        case "payment.pending":
          console.log(`${WEBHOOK_LOG_PREFIX} Payment pending: ${paymentId}`);
          break;
        case "payment.approved":
          console.log(`${WEBHOOK_LOG_PREFIX} Payment approved: ${paymentId}`);
          break;
        case "payment.rejected":
          console.log(`${WEBHOOK_LOG_PREFIX} Payment rejected: ${paymentId}`);
          break;
        case "payment.cancelled":
          console.log(`${WEBHOOK_LOG_PREFIX} Payment cancelled: ${paymentId}`);
          break;
        case "payment.refunded":
          console.log(`${WEBHOOK_LOG_PREFIX} Payment refunded: ${paymentId}`);
          break;
        case "payment.charged_back":
          console.log(`${WEBHOOK_LOG_PREFIX} Payment charged back: ${paymentId}`);
          break;
        default:
          console.log(`${WEBHOOK_LOG_PREFIX} Unknown payment action: ${action}`);
      }

      // Acknowledge receipt
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ── Unknown topic type ────────────────────────────────────────────────
    console.log(`${WEBHOOK_LOG_PREFIX} Ignored topic type: ${payload.type}`);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`${WEBHOOK_LOG_PREFIX} Unexpected error:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET handler: Mercado Pago may call this to verify the endpoint
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");
  const topic = req.nextUrl.searchParams.get("topic");

  if (mode === "webhook" && topic) {
    console.log(`${WEBHOOK_LOG_PREFIX} Verification ping — mode=${mode}, topic=${topic}`);
    return new NextResponse(null, { status: 200 });
  }

  return NextResponse.json(
    { message: "Mercado Pago webhook endpoint active" },
    { status: 200 }
  );
}
