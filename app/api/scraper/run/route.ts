import { NextRequest, NextResponse } from "next/server";
import { runScraperController, getScraperStatus, isScraperRunning } from "@/api/controllers/scraper.controller";
import { ScraperError } from "@/lib/scraper/types";
import { jotakpCategories } from "@/lib/scraper/config";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  // List available categories
  if (action === "categories") {
    const categories = jotakpCategories
      .filter(c => c.idsubrubro1 > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        idsubrubro1: c.idsubrubro1,
      }));
    return NextResponse.json({ categories }, { status: 200 });
  }

  // Default: get scraper status
  try {
    const status = getScraperStatus();
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to get status", details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for concurrent execution
    if (isScraperRunning()) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: "A scraper execution is already in progress",
        },
        { status: 409 }
      );
    }

    // Parse request body for optional category filter
    let body: { categoryId?: string; idsubrubro1?: number } = {};
    try {
      body = await request.json();
    } catch {
      // No body provided - will scrape all categories
    }

    // Validate categoryId if provided
    if (body.categoryId) {
      const validIds = jotakpCategories.filter(c => c.idsubrubro1 > 0).map(c => c.id);
      if (!validIds.includes(body.categoryId)) {
        return NextResponse.json(
          {
            error: "Invalid category",
            message: `Invalid categoryId. Use GET /api/scraper/run?action=categories to see available options.`,
          },
          { status: 400 }
        );
      }
    }

    // Validate idsubrubro1 if provided
    if (body.idsubrubro1 !== undefined) {
      const validIds = jotakpCategories.filter(c => c.idsubrubro1 > 0).map(c => c.idsubrubro1);
      if (!validIds.includes(body.idsubrubro1)) {
        return NextResponse.json(
          {
            error: "Invalid category",
            message: `Invalid idsubrubro1. Use GET /api/scraper/run?action=categories to see available options.`,
          },
          { status: 400 }
        );
      }
    }

    console.log("[API] Starting scraper execution...", body);
    const result = await runScraperController(body);

    // Return success response
    return NextResponse.json(
      {
        success: result.success,
        message: `Scraper completed: ${result.created} products created`,
        data: {
          created: result.created,
          updated: result.updated,
          errors: result.errors,
          durationMs: result.durationMs,
          timestamp: result.timestamp.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Scraper execution failed:", error);

    // Handle specific error types
    if (error instanceof ScraperError) {
      if (error.code === "AUTH_FAILED") {
        return NextResponse.json(
          {
            error: "Authentication Failed",
            message: error.message,
          },
          { status: 401 }
        );
      }

      if (error.code === "CONNECTION_ERROR" || error.code === "NETWORK_ERROR") {
        return NextResponse.json(
          {
            error: "Service Unavailable",
            message: error.message,
          },
          { status: 503 }
        );
      }
    }

    // Handle configuration errors
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("not configured")) {
      return NextResponse.json(
        {
          error: "Configuration Error",
          message: message,
        },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: message,
      },
      { status: 500 }
    );
  }
}
