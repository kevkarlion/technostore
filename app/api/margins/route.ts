import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/config/db";

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const filter: Record<string, unknown> = {};

    if (category) {
      filter.categories = category;
    }

    const docs = await db
      .collection("products")
      .find(filter, {
        projection: {
          name: 1,
          costPrice: 1,
          price: 1,
          profitMargin: 1,
          categories: 1,
        },
      })
      .toArray();

    const products = docs.map((doc) => {
      // Si price es 0/null pero hay costPrice + profitMargin, calcularlo
      let price = doc.price;
      if (
        (!price || price === 0) &&
        doc.costPrice != null &&
        doc.costPrice > 0 &&
        doc.profitMargin != null
      ) {
        price = Math.round(doc.costPrice * (1 + (doc.profitMargin as number) / 100) * 100) / 100;
      }

      return {
        id: doc._id.toString(),
        name: doc.name,
        costPrice: doc.costPrice,
        price,
        profitMargin: doc.profitMargin ?? undefined,
        category: (doc.categories ?? [])[0] || "",
      };
    });

    // Traer TODAS las categorías de la DB con conteo de productos
    const categories = await db
      .collection("categories")
      .aggregate([
        {
          $lookup: {
            from: "products",
            let: { catSlug: "$slug" },
            pipeline: [
              { $match: { $expr: { $in: ["$$catSlug", "$categories"] } } },
            ],
            as: "matched",
          },
        },
        {
          $project: {
            slug: 1,
            name: 1,
            defaultProfitMargin: 1,
            productCount: { $size: "$matched" },
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray();

    return NextResponse.json({ products, categories }, { status: 200 });
  } catch (error) {
    console.error("[Margins API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch margins data" },
      { status: 500 }
    );
  }
}
