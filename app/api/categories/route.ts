import { NextRequest, NextResponse } from "next/server";
import { categoryRepository } from "@/api/repository/category.repository";

export async function GET() {
  try {
    const categories = await categoryRepository.findAll();
    return NextResponse.json({ items: categories, total: categories.length }, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
