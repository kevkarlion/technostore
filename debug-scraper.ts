import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

import * as cheerio from "cheerio";

async function debugScraper() {
  const config = await import("./src/lib/scraper/config").then(m => m.getScraperConfig());
  const url = `${config.baseUrl}/buscar.aspx?idsubrubro1=100`;
  
  console.log("Fetching URL:", url);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  console.log("\n=== Debug: Looking for articles ===");
  const articles = $("article");
  console.log(`Found ${articles.length} articles`);
  
  // First article detail
  if (articles.length > 0) {
    const firstArticle = articles.first();
    console.log("\nFirst article HTML:", firstArticle.html()?.substring(0, 500));
    
    // Look for tg-article-img
    const tgImg = firstArticle.find(".tg-article-img");
    console.log(`\nFound .tg-article-img elements: ${tgImg.length}`);
    
    if (tgImg.length > 0) {
      const style = tgImg.first().attr("style");
      console.log("Style attribute:", style);
      
      if (style) {
        const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        console.log("Background match:", bgMatch);
      }
    }
    
    // Look for any element with style containing background-image
    const bgDivs = firstArticle.find("[style*='background-image']");
    console.log(`\nFound elements with background-image: ${bgDivs.length}`);
    
    // Get ALL divs with style
    const allDivsWithStyle = firstArticle.find("div[style]");
    console.log(`\nFound divs with style: ${allDivsWithStyle.length}`);
    
    allDivsWithStyle.each((i, el) => {
      const style = $(el).attr("style");
      if (style && style.includes("background")) {
        console.log(`  Div ${i}:`, style?.substring(0, 100));
      }
    });
  }
}

debugScraper().catch(console.error);
