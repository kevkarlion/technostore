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
      return data?.venta ?? 1400; // Default to 1400 if not found
    }
  } catch (err) {
    console.error("[enrich-cost-price] Failed to fetch exchange rate:", err);
  }
  return 1400; // Fallback default
}

/**
 * Enriches order items with current costPrice from the products collection.
 * Also converts costPrice from USD to ARS using the current exchange rate.
 *
 * Batch-lookup strategy:
 * 1. Collect all unique productIds from items
 * 2. Fetch current costPrice for all of them in one query
 * 3. Merge back: item.costPrice takes priority (historical value), fallback to live costPrice
 * 4. Convert costPrice from USD to ARS
 *
 * Items whose costPrice is null/undefined after lookup stay as-is (unpriced).
 * This is non-critical — if the product lookup fails, items keep their original costPrice.
 */
export async function enrichItemsWithCostPrice(
  items: OrderItem[]
): Promise<OrderItem[]> {
  const productIds = items
    .map((item) => item.productId)
    .filter((id): id is string => !!id);

  if (productIds.length === 0) return items;

  try {
    const db = await getDb();
    const products = await db
      .collection("products")
      .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
      .project({ costPrice: 1 })
      .toArray();

    // Get exchange rate to convert USD to ARS
    const exchangeRate = await getExchangeRate();

    const costMap = new Map(
      products.map((p: any) => [p._id.toString(), p.costPrice])
    );

    return items.map((item) => {
      // Get cost price from DB (in USD) or use historical value
      const costPriceUsd = item.costPrice ?? costMap.get(item.productId) ?? undefined;
      
      // Convert cost price from USD to ARS
      let costPriceArs: number | undefined;
      if (costPriceUsd != null && costPriceUsd > 0) {
        costPriceArs = Math.round(costPriceUsd * exchangeRate * 100) / 100;
      }

      return {
        ...item,
        costPrice: costPriceArs, // Store as ARS
      };
    });
  } catch (err) {
    // Non-critical: if lookup fails, return items with whatever costPrice they have
    console.error("[enrich-cost-price] Failed to fetch cost prices:", err);
    return items;
  }
}
