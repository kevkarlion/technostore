import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/config/db";
import { enrichItemsWithCostPrice, type EnrichedOrderItem } from "@/lib/enrich-cost-price";
import { contabilidadQuerySchema } from "@/domain/dto/contabilidad.dto";
import type {
  ContabilidadOrder,
  ContabilidadItem,
  ContabilidadTotals,
  ContabilidadResponse,
} from "@/domain/dto/contabilidad.dto";
import { HttpError, internalServerError } from "@/api/errors/http-error";

const COLLECTION = "orders";

/**
 * Compute per-item profit fields given unitPrice, costPrice, and quantity.
 * Now uses the enriched data with USD and ARS values.
 */
function computeItemProfit(
  item: EnrichedOrderItem
): { 
  costPriceUsd: number | null; 
  costPriceArs: number | null; 
  gainUsd: number | null; 
  gainArs: number | null; 
  marginPct: number | null 
} {
  return {
    costPriceUsd: item.costPriceUsd,
    costPriceArs: item.costPriceArs,
    gainUsd: item.gainUsd,
    gainArs: item.gainArs,
    marginPct: item.marginPct,
  };
}

/**
 * Build ContabilidadItem from EnrichedOrderItem
 */
function toContabilidadItem(item: EnrichedOrderItem): ContabilidadItem {
  const profit = computeItemProfit(item);
  return {
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPriceArs ?? item.unitPrice ?? 0,  // Sale price in ARS
    unitPriceUsd: item.unitPriceUsd ?? null,               // Sale price in USD
    costPrice: profit.costPriceArs,                        // Cost in ARS
    costPriceUsd: profit.costPriceUsd,                     // Cost in USD
    gain: profit.gainArs,                                  // Gain in ARS
    gainUsd: profit.gainUsd,                               // Gain in USD
    marginPct: profit.marginPct,                           // Margin % (on USD)
  };
}

/**
 * Enrich raw order items with profit calculations.
 */
function buildContabilidadItems(
  items: EnrichedOrderItem[]
): ContabilidadItem[] {
  return items.map(toContabilidadItem);
}

/**
 * Build a ContabilidadOrder from a raw order doc.
 */
function toContabilidadOrder(doc: any): ContabilidadOrder {
  const items = buildContabilidadItems(doc.items ?? []);

  // Use ARS values for totals display
  const pricedItems = items.filter((i) => i.costPrice != null);
  const totalCost = pricedItems.reduce(
    (sum, i) => sum + (i.costPrice ?? 0) * i.quantity,
    0
  );
  const totalGain = pricedItems.reduce((sum, i) => sum + (i.gain ?? 0), 0);
  
  // Calculate average margin from USD values
  const pricedItemsWithMargin = items.filter((i) => i.marginPct != null);
  const avgMargin =
    pricedItemsWithMargin.length > 0
      ? pricedItemsWithMargin.reduce((sum, i) => sum + (i.marginPct ?? 0), 0) /
        pricedItemsWithMargin.length
      : null;

  return {
    orderId: doc.orderId,
    _id: doc._id.toString(),
    customer: {
      name: doc.customer?.name ?? "",
      lastName: doc.customer?.lastName ?? "",
      email: doc.customer?.email ?? "",
    },
    items,
    totals: {
      subtotal: doc.totals?.subtotal ?? 0,
      shipping: doc.totals?.shipping ?? 0,
      taxes: doc.totals?.taxes ?? 0,
      total: doc.totals?.total ?? 0,
    },
    totalCost,
    totalGain,
    avgMargin,
    unpricedCount: items.filter((i) => i.costPrice == null).length,
    createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt,
    status: doc.status ?? "unknown",
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Parse & validate query params
    const parsed = contabilidadQuerySchema.safeParse({
      startDate: url.searchParams.get("startDate") ?? undefined,
      endDate: url.searchParams.get("endDate") ?? undefined,
      page: url.searchParams.get("page") ?? "1",
      limit: url.searchParams.get("limit") ?? "20",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Parámetros inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { startDate, endDate, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    // Build date filter
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dateFilter: Record<string, unknown> = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    } else {
      dateFilter.$gte = thirtyDaysAgo;
    }
    if (endDate) {
      // Set to end of day for inclusive range
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const filter: Record<string, unknown> = {
      status: "captured",
      createdAt: dateFilter,
    };

    const db = await getDb();
    const collection = db.collection(COLLECTION);

    // Fetch paginated orders + total count in parallel
    const [docs, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    // No orders — return empty response early
    if (docs.length === 0) {
      const response: ContabilidadResponse = {
        items: [],
        totals: {
          totalOrders: 0,
          totalRevenue: 0,
          totalCosts: 0,
          totalProfit: 0,
          avgMargin: null,
          unpricedOrders: 0,
          unpricedItemCount: 0,
        },
        page,
        limit,
        totalPages: 0,
        total: 0,
      };
      return NextResponse.json(response);
    }

    // Enrich all items with costPrice in parallel, then build enriched orders
    const enrichedDocs = await Promise.all(
      docs.map(async (doc) => {
        const enrichedItems = await enrichItemsWithCostPrice(doc.items ?? []);
        return { ...doc, items: enrichedItems };
      })
    );

    const contabilidadOrders = enrichedDocs.map(toContabilidadOrder);

    // Compute aggregates across ALL matching orders (not just the page)
    // For totals we need a separate aggregation since we're enriching costPrice
    // Use a two-pass approach: count all, then sample enrichment pattern
    // Since enrichment is per-item, we get an approximation via the pipeline

    // For accurate totals, aggregate over the full dataset
    const aggregation = await collection
      .aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totals.total" },
          },
        },
      ])
      .toArray();

    const agg = aggregation[0] ?? { totalOrders: 0, totalRevenue: 0 };

    // For cost/profit totals we need enriched data — compute from enriched page
    // as an approximation, plus use a server-side aggregation for item-level costs
    // Use a $unwind + $lookup approach for accurate totals
    let totalCosts = 0;
    let totalProfit = 0;
    let unpricedOrders = 0;
    let unpricedItemCount = 0;

    for (const order of contabilidadOrders) {
      if (order.totalCost != null) totalCosts += order.totalCost;
      if (order.totalGain != null) totalProfit += order.totalGain;
      if (order.unpricedCount > 0) unpricedOrders++;
      unpricedItemCount += order.unpricedCount;
    }

    // Compute avg margin as weighted average across all enriched orders
    const pricedOrders = contabilidadOrders.filter((o) => o.avgMargin != null);
    const avgMargin =
      pricedOrders.length > 0
        ? pricedOrders.reduce((sum, o) => sum + (o.avgMargin ?? 0), 0) /
          pricedOrders.length
        : null;

    // For accurate totals across ALL matching orders, do a second enriched query
    // We enrich in batches to avoid MongoDB memory issues with large datasets
    // For now, use a simplified aggregation that reads costPrice from items if present
    // and falls back to live product prices via a $lookup
    const totalsAgg = await collection
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            pipeline: [{ $project: { costPrice: 1 } }],
            as: "_products",
          },
        },
        { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            "_items_costPrice": {
              $ifNull: [
                "$items.costPrice",
                {
                  $let: {
                    vars: {
                      productObj: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$_products",
                              as: "p",
                              cond: {
                                $eq: [
                                  "$$p._id",
                                  { $toObjectId: "$items.productId" },
                                ],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$productObj.costPrice",
                  },
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            items: { $push: "$items" },
            costPriceSum: { $sum: { $multiply: ["$_items_costPrice", "$items.quantity"] } },
            revenue: { $first: "$totals.total" },
            hasUnpriced: {
              $max: {
                $cond: [{ $eq: ["$_items_costPrice", null] }, 1, 0],
              },
            },
            unpricedItemCount: {
              $sum: {
                $cond: [{ $eq: ["$_items_costPrice", null] }, 1, 0],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$revenue" },
            totalCosts: { $sum: { $ifNull: ["$costPriceSum", 0] } },
            totalProfit: { $sum: { $subtract: ["$revenue", { $ifNull: ["$costPriceSum", 0] }] } },
            unpricedOrders: { $sum: { $max: ["$hasUnpriced", 0] } },
            unpricedItemCountTotal: { $sum: "$unpricedItemCount" },
          },
        },
        {
          $project: {
            _id: 0,
            totalOrders: 1,
            totalRevenue: 1,
            totalCosts: 1,
            totalProfit: 1,
            unpricedOrders: 1,
            unpricedItemCount: { $ifNull: ["$unpricedItemCountTotal", 0] },
          },
        },
      ])
      .toArray();

    const totalsResult = totalsAgg[0];

    const totals: ContabilidadTotals = {
      totalOrders: totalsResult?.totalOrders ?? agg.totalOrders,
      totalRevenue: totalsResult?.totalRevenue ?? agg.totalRevenue,
      totalCosts: totalsResult?.totalCosts ?? totalCosts,
      totalProfit: totalsResult?.totalProfit ?? totalProfit,
      avgMargin,
      unpricedOrders: totalsResult?.unpricedOrders ?? unpricedOrders,
      unpricedItemCount: totalsResult?.unpricedItemCount ?? unpricedItemCount,
    };

    const response: ContabilidadResponse = {
      items: contabilidadOrders,
      totals,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { message: error.message, details: error.details },
        { status: error.status }
      );
    }
    console.error("[Admin Contabilidad API] Error:", error);
    const fallback = internalServerError();
    return NextResponse.json(
      { message: fallback.message },
      { status: fallback.status }
    );
  }
}
