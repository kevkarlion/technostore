import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  type MercadopagoWebhookPayload,
} from "@/lib/mercadopago/client";
import { orderRepository } from "@/api/repository/order.repository";
import type { OrderStatus } from "@/domain/models/order";

const WEBHOOK_LOG_PREFIX = "[MP Webhook]";

/**
 * Map MP payment actions to our order status.
 * With capture_mode: manual, "approved" means funds reserved (not captured yet).
 */
function mapActionToStatus(action: string): OrderStatus | null {
  switch (action) {
    case "payment.created":
    case "payment.pending":
      return "pending";
    case "payment.approved":
      return "reserved";
    case "payment.rejected":
      return "failed";
    case "payment.cancelled":
      return "cancelled";
    case "payment.refunded":
    case "payment.charged_back":
      return "refunded";
    default:
      return null;
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Read raw body (needed for HMAC signature verification) ─────────────
    const rawBody = await req.text();

    const signature = req.headers.get("x-signature") ?? "";
    const timestamp = req.headers.get("x-signature-timestamp") ?? "";

    // ── Signature verification ─────────────────────────────────────────────
    // Si MP envía firma la validamos; si no (ej. prueba de MP), igual procesamos.
    if (signature && timestamp) {
      const isValid = verifyWebhookSignature(signature, timestamp, rawBody);
      if (!isValid) {
        console.warn(`${WEBHOOK_LOG_PREFIX} Invalid signature — rejecting request`);
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }
    } else {
      console.warn(`${WEBHOOK_LOG_PREFIX} No signature headers — accepting without verification (test mode?)`);
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

      // Determine new status from action
      const newStatus = mapActionToStatus(action);
      if (newStatus) {
        try {
          // Find order by paymentId in MongoDB
          const order = await orderRepository.findByPaymentId(String(paymentId));
          if (order && order._id) {
            await orderRepository.updateStatus(
              order._id.toString(),
              newStatus,
              `Webhook: ${action}`
            );
            console.log(
              `${WEBHOOK_LOG_PREFIX} Updated order ${order.orderId} → ${newStatus}`
            );
          } else {
            console.log(
              `${WEBHOOK_LOG_PREFIX} No order found for payment ${paymentId} — may be created later via checkout`
            );
          }
        } catch (dbErr) {
          // Non-blocking: log but don't fail the webhook response
          console.error(
            `${WEBHOOK_LOG_PREFIX} Failed to update order for payment ${paymentId}:`,
            dbErr
          );
        }
      }

      // Always acknowledge receipt — MP expects 200
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
