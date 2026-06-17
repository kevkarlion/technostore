import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/config/db";

export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();
    const { categorySlug, profitMargin } = body;

    if (!categorySlug || typeof categorySlug !== "string") {
      return NextResponse.json(
        { error: "categorySlug is required" },
        { status: 400 }
      );
    }

    if (profitMargin == null || typeof profitMargin !== "number") {
      return NextResponse.json(
        { error: "profitMargin debe ser un número válido" },
        { status: 400 }
      );
    }

    const now = new Date();
    const category = await db
      .collection("categories")
      .findOneAndUpdate(
        { slug: categorySlug },
        {
          $set: {
            defaultProfitMargin: profitMargin,
            updatedAt: now,
          },
          $setOnInsert: {
            name: categorySlug,
            slug: categorySlug,
            description: "",
            createdAt: now,
          },
        },
        { upsert: true, returnDocument: "after" }
      );

    const result = await db.collection("products").updateMany(
      {
        categories: categorySlug,
        costPrice: { $exists: true, $ne: null },
      },
      [
        {
          $set: {
            profitMargin: profitMargin,
            price: {
              $round: [
                { $multiply: ["$costPrice", { $add: [1, { $divide: [profitMargin, 100] }] }] },
                2,
              ],
            },
            updatedAt: now,
          },
        },
      ]
    );

    return NextResponse.json({
      updatedProducts: result.modifiedCount,
      category: {
        slug: categorySlug,
        name: category?.name || categorySlug,
        defaultProfitMargin: profitMargin,
      },
    });
  } catch (error) {
    console.error("[Margins Bulk API] Error:", error);
    return NextResponse.json(
      { error: "Failed to apply bulk margin update" },
      { status: 500 }
    );
  }
}
