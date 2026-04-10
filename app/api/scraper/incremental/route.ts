import { NextRequest, NextResponse } from "next/server";
import { runIncrementalScraper } from "@/lib/scraper/incremental-scraper.service";
import { isScraperRunning } from "@/api/controllers/scraper.controller";

/**
 * API para scraping incremental
 * 
 * GET /api/scraper/incremental - Get status
 * POST /api/scraper/incremental - Run incremental scraper
 * 
 * Este endpoint está diseñado para llamarse cada 2 horas desde un cron job
 */
export async function GET() {
  return NextResponse.json({
    message: "Use POST to run incremental scraper",
    usage: {
      method: "POST",
      body: {
        forceFullScrape: "boolean - optional, forces full scrape ignoring pre-check"
      }
    }
  }, { status: 200 });
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

    // Parse body for optional force flag
    let body: { forceFullScrape?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // No body provided
    }

    console.log("[API] Starting incremental scraper...", body);
    
    const result = await runIncrementalScraper(body.forceFullScrape || false);

    return NextResponse.json({
      success: result.success,
      preCheck: {
        total: result.preCheck.total,
        changed: result.preCheck.changed.length,
        unchanged: result.preCheck.unchanged.length,
        errors: result.preCheck.errors.length,
        categoriesChanged: result.preCheck.changed,
        categoriesUnchanged: result.preCheck.unchanged,
        categoriesWithErrors: result.preCheck.errors
      },
      scrape: result.scrapeResult ? {
        created: result.scrapeResult.created,
        updated: result.scrapeResult.updated,
        durationMs: result.scrapeResult.durationMs,
        errors: result.scrapeResult.errors
      } : null,
      timestamp: result.timestamp.toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error("[API] Incremental scraper failed:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: message,
      },
      { status: 500 }
    );
  }
}