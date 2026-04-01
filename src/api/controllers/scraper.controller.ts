import { runScraper } from "@/lib/scraper/scraper.service";
import type { ScraperResult } from "@/lib/scraper/types";
import { ScraperError } from "@/lib/scraper/types";
import { getScraperConfig } from "@/lib/scraper/config";

/**
 * In-memory lock to prevent concurrent executions
 */
let isRunning = false;

/**
 * Check if scraper is currently running
 */
export function isScraperRunning(): boolean {
  return isRunning;
}

/**
 * Run the scraper
 * @returns Promise with ScraperResult
 * @throws ScraperError if scraper fails
 */
export async function runScraperController(): Promise<ScraperResult> {
  // Check if already running
  if (isRunning) {
    throw new Error("Scraper is already running");
  }

  // Check if configuration is valid
  try {
    getScraperConfig();
  } catch (configError) {
    const message = configError instanceof Error ? configError.message : "Unknown error";
    throw new Error(`Scraper not configured: ${message}`);
  }

  isRunning = true;

  try {
    console.log("[Controller] Starting scraper...");
    const result = await runScraper();
    console.log("[Controller] Scraper completed:", result);
    return result;
  } catch (error) {
    console.error("[Controller] Scraper failed:", error);
    throw error;
  } finally {
    isRunning = false;
  }
}

/**
 * Get scraper status
 */
export function getScraperStatus(): { running: boolean; timestamp: string } {
  return {
    running: isRunning,
    timestamp: new Date().toISOString(),
  };
}
