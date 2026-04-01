import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { productRepository } from "./src/api/repository/product.repository";
import type { RawProduct } from "./src/lib/scraper/types";
import { getScraperConfig } from "./src/lib/scraper/config";
import { transformProducts } from "./src/lib/scraper/data-transformer";

interface ScraperResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
  durationMs: number;
  timestamp: Date;
  imagesDownloaded: number;
}

const cookies: string[] = [];

async function fetchWithTimeout(url: string, timeout = 30000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        ...(cookies.length > 0 ? { 'Cookie': cookies.join('; ') } : {}),
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const setCookie = response.headers.get('set-cookie');
    if (setCookie && !cookies.includes(setCookie.split(';')[0])) {
      cookies.push(setCookie.split(';')[0]);
    }
    
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function doLogin(config: ReturnType<typeof getScraperConfig>): Promise<boolean> {
  console.log("[Scraper] Attempting login to capture session cookies...");
  
  try {
    const loginPageUrl = config.loginUrl;
    const loginHtml = await fetchWithTimeout(loginPageUrl);
    const $ = cheerio.load(loginHtml);
    
    const viewState = $("#__VIEWSTATE").val()?.toString() || "";
    const eventValidation = $("#__EVENTVALIDATION").val()?.toString() || "";
    
    await fetch(loginPageUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        '__VIEWSTATE': viewState as string,
        '__EVENTVALIDATION': eventValidation as string,
        'TxtEmail': config.email,
        'TxtPass1': config.password,
        'BtnIngresar': 'Ingresar',
      }).toString(),
    });
    
    return true;
  } catch (error) {
    console.error("[Scraper] Login error:", error);
    return true;
  }
}

async function scrapeCategory(categoryId: number, categoryName: string): Promise<RawProduct[]> {
  const config = getScraperConfig();
  const baseUrl = config.baseUrl;
  const url = `${baseUrl}/buscar.aspx?idsubrubro1=${categoryId}`;
  
  console.log(`[Scraper] Fetching category: ${categoryName} (id=${categoryId})`);
  
  const html = await fetchWithTimeout(url);
  const $ = cheerio.load(html);
  
  const products: RawProduct[] = [];
  
  $("article").each((_, article) => {
    try {
      const $article = $(article);
      const $link = $article.find("a[href*='articulo.aspx?id=']").first();
      
      if (!$link.length) return;
      
      const href = $link.attr("href");
      const fullText = $link.text().trim();
      
      if (!href) return;
      
      const idMatch = href.match(/id=(\d+)/);
      const externalId = idMatch ? idMatch[1] : href;
      const name = fullText.substring(0, 200);
      
      if (!name || name.length < 3) return;
      
      const imageUrls: string[] = [];
      
      $article.find(".tg-article-img, [style*='background-image']").each((_, el) => {
        const style = $(el).attr("style");
        if (style) {
          const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
          if (bgMatch && bgMatch[1]) {
            const bgUrl = bgMatch[1];
            const finalUrl = bgUrl.startsWith('http') ? bgUrl : `${baseUrl}/${bgUrl}`;
            if (!imageUrls.includes(finalUrl)) {
              imageUrls.push(finalUrl);
            }
          }
        }
      });
      
      const priceMatch = fullText.match(/U\$D\s+([\d.,]+)/);
      const priceRaw = priceMatch ? priceMatch[1] : "0";
      
      const rawProduct: RawProduct = {
        externalId,
        name,
        priceRaw,
        priceWithIvaRaw: undefined,
        imageUrls,
        categories: [categoryName],
        productUrl: href,
        rawElement: undefined,
      };
      
      products.push(rawProduct);
    } catch (error) {
      console.error("[Scraper] Error parsing product:", error);
    }
  });
  
  console.log(`[Scraper] Found ${products.length} products in ${categoryName}`);
  return products;
}

/**
 * Visit product detail page and get ALL images and description
 */
async function scrapeProductDetail(externalId: string, baseUrl: string): Promise<{ images: string[]; description?: string }> {
  const url = `${baseUrl}/articulo.aspx?id=${externalId}`;
  
  try {
    const html = await fetchWithTimeout(url);
    const $ = cheerio.load(html);
    
    const allImages: string[] = [];
    let description: string | undefined;
    
    // Extract description from divArticuloDescripcion
    const descDiv = $("#divArticuloDescripcion, #ContentPlaceHolder1_divArticuloDescripcion");
    if (descDiv.length > 0) {
      description = descDiv.text().trim();
      if (description) {
        console.log(`[Scraper] Found description for ${externalId}: ${description.substring(0, 50)}...`);
      }
    }
    
    // Method 1: Look for gallery images with data-src
    // Pattern: <div class='tg-gal-img' data-src='imagenes/000012509.JPG'>
    $(".tg-gal-img").each((_, el) => {
      const dataSrc = $(el).attr("data-src");
      if (dataSrc) {
        // Try full-size first
        let fullPath = dataSrc;
        
        // Convert thumbnail path to full image path
        // imagenes/min/imagen00012509.jpg -> imagenes/min/imagen00012509.jpg (try both)
        // data-src might be: imagenes/000012509.JPG
        const match = dataSrc.match(/imagenes\/(\d+)\.JPG/i);
        if (match) {
          // Try full-size: imagenes/000012509.JPG
          fullPath = `imagenes/${match[1]}.JPG`;
          const fullUrl = `${baseUrl}/${fullPath}`;
          if (!allImages.includes(fullUrl)) {
            allImages.push(fullUrl);
          }
        } else if (dataSrc.startsWith('http')) {
          if (!allImages.includes(dataSrc)) {
            allImages.push(dataSrc);
          }
        } else {
          const fullUrl = `${baseUrl}/${dataSrc}`;
          if (!allImages.includes(fullUrl)) {
            allImages.push(fullUrl);
          }
        }
      }
    });
    
    // Method 2: Also check for background-image in gallery
    $(".tg-gal-img[style*='background-image']").each((_, el) => {
      const style = $(el).attr("style");
      if (style) {
        const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (bgMatch && bgMatch[1]) {
          let imgUrl = bgMatch[1];
          const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${baseUrl}/${imgUrl}`;
          if (!allImages.includes(fullUrl)) {
            allImages.push(fullUrl);
          }
        }
      }
    });
    
    // Method 3: If still no images, try to get from thumbnail URLs
    if (allImages.length === 0) {
      const thumbMatch = url.match(/id=(\d+)/);
      if (thumbMatch) {
        // Try the thumbnail directly
        const thumbUrl = `${baseUrl}/imagenes/min/imagen000${thumbMatch[1].padStart(8, '0')}.jpg`;
        allImages.push(thumbUrl);
      }
    }
    
    return { images: allImages, description };
  } catch (error) {
    console.error(`[Scraper] Error scraping detail for ${externalId}:`, error);
    return { images: [], description: undefined };
  }
}

async function downloadImage(imageUrl: string, supplier: string, productId: string, index: number): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
        ...(cookies.length > 0 ? { 'Cookie': cookies.join('; ') } : {}),
      },
    });
    
    if (!response.ok) {
      console.log(`[Scraper] Image download failed: ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const supplierDir = path.join(process.cwd(), 'public', 'images', 'suppliers', supplier);
    if (!fs.existsSync(supplierDir)) {
      fs.mkdirSync(supplierDir, { recursive: true });
    }
    
    const ext = path.extname(imageUrl) || '.jpg';
    const filename = `${supplier}_${productId}_${index}${ext}`;
    const filepath = path.join(supplierDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    return `/images/suppliers/${supplier}/${filename}`;
  } catch (error) {
    console.log(`[Scraper] Image download error: ${error}`);
    return null;
  }
}

async function runScraper(): Promise<ScraperResult> {
  const startTime = Date.now();
  const result: ScraperResult = {
    success: false,
    created: 0,
    updated: 0,
    errors: [],
    durationMs: 0,
    timestamp: new Date(),
    imagesDownloaded: 0,
  };
  
  try {
    const config = getScraperConfig();
    const { jotakpCategories } = await import("./src/lib/scraper/config");
    
    // Try login first
    await doLogin(config);
    
    // Scrape first 3 categories for testing
    const validCategories = jotakpCategories.filter(c => c.idsubrubro1 > 0).slice(0, 3);
    
    console.log(`[Scraper] Will scrape ${validCategories.length} categories:`, validCategories.map(c => c.name).join(", "));
    
    const allProducts: RawProduct[] = [];
    
    for (const category of validCategories) {
      const products = await scrapeCategory(category.idsubrubro1, category.name);
      allProducts.push(...products);
    }
    
    if (allProducts.length === 0) {
      console.log("[Scraper] No products found!");
      result.success = true;
      result.durationMs = Date.now() - startTime;
      return result;
    }
    
    console.log(`[Scraper] Total products scraped: ${allProducts.length}`);
    
    // Transform products
    console.log("[Scraper] Transforming products...");
    const { products: transformedProducts, errors } = transformProducts(allProducts, config.supplier);
    result.errors.push(...errors);
    
    // Save to database with ALL images from detail page
    console.log("[Scraper] Saving products to database...");
    for (const product of transformedProducts) {
      try {
        // First, get all images and description from the detail page
        const detailData = await scrapeProductDetail(product.externalId, config.baseUrl);
        
        console.log(`[Scraper] Found ${detailData.images.length} images for product ${product.externalId}`);
        
        // Download all images locally
        const localImagePaths: string[] = [];
        
        for (let i = 0; i < detailData.images.length; i++) {
          const localPath = await downloadImage(detailData.images[i], config.supplier, product.externalId, i);
          if (localPath) {
            localImagePaths.push(localPath);
            result.imagesDownloaded++;
          }
        }
        
        // If we got images from detail page, use those; otherwise use the thumbnail from list
        const finalImageUrls = localImagePaths.length > 0 ? localImagePaths : product.imageUrls;
        
        const productWithLocalImages = {
          ...product,
          imageUrls: finalImageUrls,
          description: detailData.description || product.description,
        };
        
        await productRepository.upsertByExternalId(productWithLocalImages);
        result.created++;
        console.log(`[Scraper] Saved product ${product.externalId} with ${finalImageUrls.length} images and description: ${detailData.description ? 'YES' : 'NO'}`);
      } catch (dbError) {
        const errorMsg = dbError instanceof Error ? dbError.message : "Unknown error";
        result.errors.push(`Failed to save product ${product.name}: ${errorMsg}`);
      }
    }
    
    result.success = true;
    console.log(`[Scraper] Completed: ${result.created} products saved, ${result.imagesDownloaded} images downloaded`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(`Error: ${message}`);
    console.error("[Scraper] Pipeline failed:", message);
  }
  
  result.durationMs = Date.now() - startTime;
  return result;
}

runScraper()
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => console.error(e));
