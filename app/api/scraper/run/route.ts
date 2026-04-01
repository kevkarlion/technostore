import { NextRequest, NextResponse } from "next/server";
import { runScraperController, getScraperStatus, isScraperRunning } from "@/api/controllers/scraper.controller";
import { ScraperError } from "@/lib/scraper/types";

export async function GET() {
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

export async function POST() {
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

    // Run the scraper
    console.log("[API] Starting scraper execution...");
    const result = await runScraperController();

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
