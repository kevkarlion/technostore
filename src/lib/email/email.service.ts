import nodemailer from "nodemailer";
import { getSmtpConfig } from "./email.config";
import {
  buyerConfirmationHtml,
  adminNotificationHtml,
} from "./email.templates";
import type { Order } from "@/domain/models/order";

const STORE_NAME = "TechnoStore";

// ─── Transport (lazy singleton) ─────────────────────────────────────────────

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;

  const config = getSmtpConfig();
  if (!config) return null;

  _transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return _transporter;
}

// ─── Send helpers ───────────────────────────────────────────────────────────

/**
 * Send an email. Returns false when SMTP is not configured (graceful skip).
 * Never throws — errors are logged and swallowed so the caller flow is not blocked.
 */
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const config = getSmtpConfig();
  const transporter = getTransporter();

  if (!config || !transporter) {
    console.warn(`[Email] SMTP not configured — skipping email to ${options.to}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[Email] Sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send to ${options.to}:`, err);
    return false;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Send order confirmation email to the buyer.
 * Called automatically when a purchase is fully confirmed (webhook + admin capture).
 */
export async function sendBuyerConfirmation(order: Order): Promise<boolean> {
  const html = buyerConfirmationHtml(order, STORE_NAME);
  return sendEmail({
    to: order.customer.email,
    subject: `✓ Pedido confirmado — #${order.orderId.substring(0, 8)}`,
    html,
  });
}

/**
 * Send new sale notification to the store admin.
 * Called together with buyer confirmation.
 */
export async function sendAdminNotification(order: Order): Promise<boolean> {
  const config = getSmtpConfig();
  if (!config) return false;

  const html = adminNotificationHtml(order, STORE_NAME);
  return sendEmail({
    to: config.adminEmail,
    subject: `🛒 Nueva venta — ${order.customer.name} ${order.customer.lastName} — $${order.totals.total.toFixed(2)}`,
    html,
  });
}
