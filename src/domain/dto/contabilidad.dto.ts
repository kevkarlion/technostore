import { z } from "zod";

/* ── Query params ─────────────────────────────────────────── */

export const contabilidadQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ContabilidadQueryDTO = z.infer<typeof contabilidadQuerySchema>;

/* ── Enriched order item ──────────────────────────────────── */

export interface ContabilidadItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number | null;
  gain: number | null;       // (unitPrice - costPrice) * quantity
  marginPct: number | null;  // ((unitPrice - costPrice) / costPrice) * 100
}

/* ── Enriched order ───────────────────────────────────────── */

export interface ContabilidadOrder {
  orderId: string;
  _id: string;
  customer: {
    name: string;
    lastName: string;
    email: string;
  };
  items: ContabilidadItem[];
  totals: {
    subtotal: number;
    shipping: number;
    taxes: number;
    total: number;
  };
  totalCost: number | null;   // Σ(costPrice × quantity) for priced items
  totalGain: number | null;   // Σ gain for priced items
  avgMargin: number | null;   // avg marginPct across priced items
  unpricedCount: number;      // items without costPrice
  createdAt: string;
  status: string;
}

/* ── Aggregates ───────────────────────────────────────────── */

export interface ContabilidadTotals {
  totalOrders: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  avgMargin: number | null;
  unpricedOrders: number;
  unpricedItemCount: number;
}

/* ── Full response ────────────────────────────────────────── */

export interface ContabilidadResponse {
  items: ContabilidadOrder[];
  totals: ContabilidadTotals;
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}
