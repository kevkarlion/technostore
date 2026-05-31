import { getDb } from "@/config/db";
import { ObjectId } from "mongodb";
import type { OrderItem } from "@/domain/models/order";

/**
 * Enriches order items with current costPrice from the products collection.
 *
 * Batch-lookup strategy:
 * 1. Collect all unique productIds from items
 * 2. Fetch current costPrice for all of them in one query
 * 3. Merge back: item.costPrice takes priority (historical value), fallback to live costPrice
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

    const costMap = new Map(
      products.map((p: any) => [p._id.toString(), p.costPrice])
    );

    return items.map((item) => ({
      ...item,
      costPrice: item.costPrice ?? costMap.get(item.productId) ?? undefined,
    }));
  } catch (err) {
    // Non-critical: if lookup fails, return items with whatever costPrice they have
    console.error("[enrich-cost-price] Failed to fetch cost prices:", err);
    return items;
  }
}
