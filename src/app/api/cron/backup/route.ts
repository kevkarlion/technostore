import { NextResponse } from "next/server";
import { runIncrementalScraper } from "@/lib/scraper/incremental-scraper.service";

// Protection: only allow internal calls or cron jobs
const CRON_SECRET = process.env.CRON_SECRET;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

/**
 * Send notification to Discord when scraper finishes
 */
async function sendDiscordNotification(result: {
  success: boolean;
  preCheck: { changed: string[]; unchanged: string[]; errors: string[] };
  scrapeResult?: { created: number; updated: number; durationMs: number };
}) {
  if (!DISCORD_WEBHOOK_URL) return;

  const { preCheck, scrapeResult, success } = result;
  
  const embed = {
    title: success ? "✅ Scraping Incremental - Completado" : "❌ Scraping - Error",
    color: success ? 65280 : 16711680,
    fields: [
      {
        name: "Pre-check",
        value: `${preCheck.changed.length} cambiados • ${preCheck.unchanged.length} sin cambios • ${preCheck.errors.length} errores`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "TechnoStore Scraper" }
  };

  if (scrapeResult) {
    embed.fields.push({
      name: "Resultado",
      value: `${scrapeResult.created} creados • ${scrapeResult.updated} actualizados`,
      inline: true
    });
    embed.fields.push({
      name: "Duración",
      value: `${Math.round(scrapeResult.durationMs / 1000 / 60)} min`,
      inline: true
    });
  }

  if (preCheck.errors.length > 0) {
    embed.fields.push({
      name: "Errores",
      value: preCheck.errors.slice(0, 5).join("\n"),
      inline: false
    });
  }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [embed],
        username: "TechnoStore Scraper"
      })
    });
    console.log("[Cron] Discord notification sent");
  } catch (error) {
    console.error("[Cron] Failed to send Discord notification:", error);
  }
}

/**
 * Send a simple Discord notification
 */
async function sendStartNotification() {
  if (!DISCORD_WEBHOOK_URL) return;
  
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "🔄 Iniciando scraper incremental...",
        username: "TechnoStore Scraper"
      })
    });
  } catch (error) {
    console.error("[Cron] Failed to send start notification:", error);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Verify cron secret if provided
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting incremental scraper...");
    
    // Notify start (optional)
    if (searchParams.get("notify") === "true") {
      await sendStartNotification();
    }
    
    const result = await runIncrementalScraper();
    
    console.log("[Cron] Scraper completed:", result.success);
    
    // Send notification on finish (if webhook configured)
    if (DISCORD_WEBHOOK_URL) {
      await sendDiscordNotification(result);
    }
    
    return NextResponse.json({
      success: true,
      preCheck: result.preCheck,
      scrapeResult: result.scrapeResult,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    
    // Send error notification
    if (DISCORD_WEBHOOK_URL) {
      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `❌ Error en scraper: ${error}`,
            username: "TechnoStore Scraper"
          })
        });
      } catch {}
    }
    
    return NextResponse.json(
      { error: "Scraper failed", details: String(error) },
      { status: 500 }
    );
  }
}