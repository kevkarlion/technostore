import { NextRequest, NextResponse } from "next/server";
import { searchEngine } from "@/lib/search/search-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  console.log("[Autocomplete] Received query:", q);

  if (!q || q.trim().length < 2) {
    console.log("[Autocomplete] Query too short, returning empty");
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const limit = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") || "8", 10)));

  try {
    const result = await searchEngine.autocomplete(q, limit);
    console.log("[Autocomplete] Results:", result.items.length, "items");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[Autocomplete] Error:", error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
