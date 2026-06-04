import { getDb } from "@/config/db";
import { ObjectId } from "mongodb";
import type { OrderItem } from "@/domain/models/order";

/**
 * Fetch the current USD to ARS exchange rate (venta price for selling)
 */
async function getExchangeRate(): Promise<number> {
  try {
    const res = await fetch(process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/exchange-rate`
      : "http://localhost:3000/api/exchange-rate", 
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      return data?.venta ?? 1400;
    }
  } catch (err) {
    console.error("[enrich-cost-price] Failed to fetch exchange rate:", err);
  }
  return 1400;
}

/**
 * Enriched order item with both USD and ARS values for accounting
 */
export interface EnrichedOrderItem extends OrderItem {
  costPriceUsd: number | null;
  costPriceArs: number | null;
  unitPriceUsd: number | null;
  unitPriceArs: number | null;
  gainUsd: number | null;
  gainArs: number | null;
  marginPct: number | null;
}

/**
 * Enriches order items with cost price and calculates profit in both currencies.
 */
export async function enrichItemsWithCostPrice(
  items: OrderItem[]
): Promise<EnrichedOrderItem[]> {
  const productIds = items
    .map((item) => item.productId)
    .filter((id): id is string => !!id);

  if (productIds.length === 0) return items as EnrichedOrderItem[];

  try {
    const db = await getDb();
    const products = await db
      .collection("products")
      .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
      .project({ costPrice: 1, profitMargin: 1 })
      .toArray();

    const exchangeRate = await getExchangeRate();

    const productMap = new Map(
      products.map((p: any) => [
        p._id.toString(), 
        { costPrice: p.costPrice, profitMargin: p.profitMargin }
      ])
    );

    return items.map((item) => {
      const costPriceUsd = item.costPrice ?? productMap.get(item.productId)?.costPrice ?? null;
      const unitPriceArs = item.unitPrice ?? 0;
      const unitPriceUsd = unitPriceArs > 0 ? unitPriceArs / exchangeRate : 0;
      
      const costPriceArs = costPriceUsd != null 
        ? Math.round(costPriceUsd * exchangeRate * 100) / 100 
        : null;
      
      let gainUsd: number | null = null;
      let gainArs: number | null = null;
      let marginPct: number | null = null;
      
      if (costPriceUsd != null && costPriceUsd > 0 && unitPriceUsd > 0) {
        gainUsd = Math.round((unitPriceUsd - costPriceUsd) * 100) / 100;
        gainArs = Math.round((unitPriceArs - costPriceArs) * 100) / 100;
        marginPct = Math.round(((unitPriceUsd - costPriceUsd) / costPriceUsd) * 10000) / 100;
      }

      return {
        ...item,
        costPriceUsd,
        costPriceArs,
        unitPriceUsd,
        unitPriceArs,
        gainUsd,
        gainArs,
        marginPct,
      };
    });
  } catch (err) {
    console.error("[enrich-cost-price] Failed to fetch cost prices:", err);
    return items as EnrichedOrderItem[];
  }
}