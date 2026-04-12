import { NextResponse } from "next/server";
import { getDb } from "@/config/db";

export async function GET() {
  const db = await getDb();
  const products = db.collection("products");
  
  // Get 3 products total (no filter)
  const all = await products.find().limit(3).toArray();
  
  // Get 3 jotakp products  
  const jotakp = await products.find({ supplier: "jotakp" }).limit(3).toArray();
  
  // Get all categories from jotakp products
  const categories = new Set();
  for (const p of await products.find({ supplier: "jotakp" }).project({ categories: 1 }).toArray()) {
    if (p.categories) {
      p.categories.forEach((c: any) => categories.add(c));
    }
  }
  
  return NextResponse.json({
    sampleProducts: all.map(p => ({ _id: p._id, supplier: p.supplier, name: p.name?.substring(0, 30), categories: p.categories })),
    jotakpProducts: jotakp.map(p => ({ name: p.name?.substring(0, 30), categories: p.categories, status: p.status })),
    uniqueCategories: Array.from(categories).slice(0, 20)
  });
}