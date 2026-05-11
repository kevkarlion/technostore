/**
 * Mercado Pago TypeScript interfaces
 * Covers preference creation, webhook payloads, and API response types.
 */

// ─── Preference Request ─────────────────────────────────────────────────────

export interface MercadopagoPreferenceItem {
  id: string;
  title: string;
  description?: string;
  picture_url?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface MercadopagoPayer {
  name: string;
  surname: string;
  email: string;
  phone?: {
    number: string;
    area_code?: string;
  };
  address?: {
    street_name: string;
    zip_code: string;
    street_number?: string;
  };
  identification?: {
    type: string;
    number: string;
  };
}

export interface MercadopagoBackUrls {
  success: string;
  failure: string;
  pending: string;
}

export interface MercadopagoPreferenceRequest {
  items: MercadopagoPreferenceItem[];
  payer: MercadopagoPayer;
  back_urls?: MercadopagoBackUrls;
  external_reference?: string;
  notification_url?: string;
  statement_descriptor?: string;
  auto_return?: "approved" | "all";
  binary_mode?: boolean;
}

// ─── Preference Response ────────────────────────────────────────────────────

export interface MercadopagoPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  collector_id: number;
  operation_type: string;
  status: string;
  external_reference: string;
  preference_url: string;
  date_created: string;
  last_updated: string;
  sponsor_id?: number | null;
  shipping_mode?: string | null;
  mock?: boolean;
  corporation_id?: string | null;
  integrator_id?: string | null;
  platform_id?: string | null;
  ad_network_id?: string | null;
  tracking_id?: string | null;
  relates_to?: string[];
  metadata?: Record<string, unknown>;
  items: MercadopagoPreferenceItem[];
  piston?: string;
  active_window?: string;
  site_id?: string;
  comparator?: string | null;
  marketplace?: string;
  damages?: string | null;
  back_url?: string;
}

// ─── Webhook ────────────────────────────────────────────────────────────────

export interface MercadopagoWebhookPayload {
  type: "payment" | "merchant_order" | "plan" | "subscription" | "invoice" | "point_integration_ipn";
  action: string;
  data?: {
    id: string;
  };
  date_created?: string;
  api_version?: string;
  id?: number;
  live_mode?: boolean;
  user_id?: number;
}

export interface MercadopagoPaymentTopic {
  type: "payment";
  action: "payment.created" | "payment.updated" | "payment.pending" | "payment.approved" | "payment.rejected" | "payment.cancelled" | "payment.refunded" | "payment.charged_back";
  data: {
    id: string;
  };
}

// ─── Error ───────────────────────────────────────────────────────────────────

export interface MercadopagoApiError {
  status: number;
  error: string;
  message: string;
  cause?: Array<{
    code: string;
    description: string;
  }>;
}
