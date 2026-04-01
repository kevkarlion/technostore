import { chromium, type Browser, type Page } from "playwright";
import { getScraperConfig } from "./config";
import { transformProducts } from "./data-transformer";
import { productRepository } from "@/api/repository/product.repository";
import type { ScraperConfig, ScraperResult, RawProduct } from "./types";
import { ScraperError } from "./types";

export class ScraperService {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config?: ScraperConfig) {
    this.config = config || getScraperConfig();
  }

  /**
   * Initialize the browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
  }

  /**
   * Close the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Wait for a specified delay
   */
  private async delay(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this.config.delayMs);
    });
  }

  /**
   * Login to the supplier website
   */
  async login(page: Page): Promise<void> {
    try {
      await page.goto(this.config.loginUrl, { waitUntil: "networkidle" });

      const selectors = this.config.selectors.login;

      // Fill in the login form
      await page.fill(selectors.emailInputSelector, this.config.email);
      await page.fill(selectors.passwordInputSelector, this.config.password);

      // Click submit
      await page.click(selectors.submitButtonSelector);

      // Wait for navigation after login
      await page.waitForLoadState("networkidle");

      // Check if login was successful by verifying we're not on the login page
      const currentUrl = page.url();
      if (currentUrl.includes("login") && !currentUrl.includes("logged")) {
        throw new Error("Login failed - still on login page");
      }

      console.log(`[Scraper] Successfully logged in as ${this.config.email}`);

      // Wait for the branch/sucursal selection modal to appear
      await this.delay();
      
      // Try to select a branch/sucursal (usually a modal appears after login)
      // Try common selectors for branch selection
      const branchSelectors = [
        "#ContentPlaceHolder1_ddlSucursal",
        "#ddlSucursal",
        "select[id*='Sucursal']",
        ".sucursal-select",
      ];

      for (const selector of branchSelectors) {
        try {
          const branchSelect = page.locator(selector);
          if (await branchSelect.count() > 0) {
            // Select the first option (or a specific branch like "Cipolletti")
            await branchSelect.selectOption({ index: 1 });
            await page.waitForLoadState("networkidle");
            console.log(`[Scraper] Selected branch/sucursal`);
            break;
          }
        } catch {
          // Try next selector
        }
      }

      // Also try clicking on a branch option directly if it's a list/buttons
      const branchLinkSelectors = [
        "a:has-text('Cipolletti')",
        "a:has-text('Neuquen')",
        ".branch-option",
      ];

      for (const selector of branchLinkSelectors) {
        try {
          const branchLink = page.locator(selector).first();
          if (await branchLink.count() > 0) {
            await branchLink.click();
            await page.waitForLoadState("networkidle");
            console.log(`[Scraper] Clicked on branch`);
            break;
          }
        } catch {
          // Try next selector
        }
      }

      await this.delay();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ScraperError(`Login failed: ${message}`, "AUTH_FAILED", error) as ScraperError;
    }
  }

  /**
   * Scrape products from a single page (Jotakp specific)
   * Products are links with format: "Name U$D 98,75+ IVA ..."
   */
  private async scrapePage(page: Page): Promise<RawProduct[]> {
    const selectors = this.config.selectors.productList;

    const products: RawProduct[] = [];

    // For Jotakp, product links are: a[href*='articulo.aspx?id=']
    const items = await page.locator(selectors.itemSelector).all();

    for (const item of items) {
      try {
        // Get the full text content and href from the link
        const fullText = await item.textContent();
        const href = await item.getAttribute("href");

        if (!fullText || !href) continue;

        // Parse the product ID from URL: articulo.aspx?id=14438
        const idMatch = href.match(/id=(\d+)/);
        const externalId = idMatch ? idMatch[1] : href;

        // Parse the text content
        // Format: "Memoria DDR4 8 Gb 3200 Hyperx Fury Beast Kingston (KF432C16BB/8)U$D 98,75+ IVA 10,5%$ 139.731,25+ IVA 10,5%"
        
        // Extract price (U$D xxx,xx)
        const priceMatch = fullText.match(/U\$D\s+([\d.,]+)/);
        const priceRaw = priceMatch ? priceMatch[1] : "0";

        // Extract price with IVA (may not always be present)
        const priceWithIvaMatch = fullText.match(/\$?([\d.]+),([\d.]+)\+ IVA/);
        
        // Extract name (everything before U$D)
        const name = fullText.replace(/U\$D[\s\d.,+IVA%]+$/, "").trim();

        // Skip if no meaningful name
        if (!name || name.length < 3) continue;

        // Try to extract image - look for img inside or near the link
        // First, check if there's an image directly inside the link
        const imageUrls: string[] = [];
        
        try {
          // Method 1: Try to find img element inside the link
          const imgElement = item.locator("img").first();
          const imgCount = await imgElement.count();
          
          if (imgCount > 0) {
            const src = await imgElement.getAttribute("src");
            const dataSrc = await imgElement.getAttribute("data-src");
            const dataOriginal = await imgElement.getAttribute("data-original");
            
            if (src && (src.startsWith("http") || src.startsWith("/"))) {
              imageUrls.push(src);
            } else if (dataSrc && (dataSrc.startsWith("http") || dataSrc.startsWith("/"))) {
              imageUrls.push(dataSrc);
            } else if (dataOriginal && (dataOriginal.startsWith("http") || dataOriginal.startsWith("/"))) {
              imageUrls.push(dataOriginal);
            }
          }
          
          // Method 2: Try to extract from background-image in style attribute
          // Format: style='background-image: url(imagenes/min/imagen00012509.jpg); '
          if (imageUrls.length === 0) {
            const style = await item.locator("[style*='background-image']").first().getAttribute("style");
            if (style) {
              const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
              if (bgMatch && bgMatch[1]) {
                const bgUrl = bgMatch[1];
                if (bgUrl.startsWith("http") || bgUrl.startsWith("/") || bgUrl.startsWith("imagenes")) {
                  imageUrls.push(bgUrl);
                }
              }
            }
          }
          
          // Method 3: Check for div with tg-article-img class (common in Jotakp templates)
          if (imageUrls.length === 0) {
            const articleImgDiv = item.locator(".tg-article-img, [class*='article-img']").first();
            const articleImgStyle = await articleImgDiv.getAttribute("style");
            if (articleImgStyle) {
              const bgMatch = articleImgStyle.match(/url\(['"]?([^'")\s]+)['"]?\)/);
              if (bgMatch && bgMatch[1]) {
                const bgUrl = bgMatch[1];
                if (bgUrl.startsWith("http") || bgUrl.startsWith("/") || bgUrl.startsWith("imagenes")) {
                  imageUrls.push(bgUrl);
                }
              }
            }
          }
        } catch {
          // No image found in this product link
        }

        const rawProduct: RawProduct = {
          externalId,
          name: name.substring(0, 200), // Limit name length
          priceRaw,
          priceWithIvaRaw: priceWithIvaMatch ? `${priceWithIvaMatch[1]},${priceWithIvaMatch[2]}` : undefined,
          imageUrls,
          categories: [],
          productUrl: href,
          rawElement: undefined,
        };

        products.push(rawProduct);
      } catch (error) {
        console.error("[Scraper] Error parsing product item:", error);
      }
    }

    console.log(`[Scraper] Found ${products.length} products on page`);
    return products;
  }

  /**
   * Scrape detailed product information from individual product pages
   */
  async scrapeProductDetail(page: Page, productUrl: string): Promise<Partial<RawProduct> | null> {
    try {
      await page.goto(productUrl, { waitUntil: "networkidle", timeout: 15000 });
      await this.delay();

      const detail: Partial<RawProduct> = {};

      // Get the page content and extract images using regex
      // The images are in format: imagenes/min/imagen00022554.jpg
      const content = await page.content();
      
      // Extract image URLs from the page content - handle both formats
      // Format: imagenes/000014645.PNG or imagenes/min/imagen00022554.jpg
      const imageMatches = content.match(/imagenes\/[min\/]*(imagen\d+|0+\d+)\.[a-zA-Z]{3,4}/gi);
      
      if (imageMatches && imageMatches.length > 0) {
        // Get unique image IDs
        const uniqueImages = [...new Set(imageMatches)];
        
        // Convert thumbnail to full-size image URLs
        // Format: imagenes/min/imagen00022554.jpg -> imagenes/imagen00022554.jpg
        const fullImageUrls = uniqueImages.map(img => {
          // Replace 'min/' with nothing to get full-size
          const fullImg = img.replace('min/', '');
          // Add base URL if it's a relative path
          return `${this.config.baseUrl}/${fullImg}`;
        });
        
        detail.imageUrls = fullImageUrls;
      }

      // Also try common selectors as fallback
      if (!detail.imageUrls || detail.imageUrls.length === 0) {
        const imageSelectors = [
          "#ContentPlaceHolder1_imgArticulo",
          "img[id*='img']",
          ".product-image img",
          "#product-image img",
          ".principal-image img",
          "img.product-img",
          "img[itemprop='image']",
          "img.main-image",
        ];

        for (const selector of imageSelectors) {
          try {
            const img = page.locator(selector).first();
            if (await img.count() > 0) {
              const src = await img.getAttribute("src");
              const dataSrc = await img.getAttribute("data-src");
              const dataOriginal = await img.getAttribute("data-original");

              if (src && (src.startsWith("http") || src.startsWith("/"))) {
                detail.imageUrls = [src.startsWith("http") ? src : `${this.config.baseUrl}${src}`];
                break;
              } else if (dataSrc && (dataSrc.startsWith("http") || dataSrc.startsWith("/"))) {
                detail.imageUrls = [dataSrc.startsWith("http") ? dataSrc : `${this.config.baseUrl}${dataSrc}`];
                break;
              } else if (dataOriginal && (dataOriginal.startsWith("http") || dataOriginal.startsWith("/"))) {
                detail.imageUrls = [dataOriginal.startsWith("http") ? dataOriginal : `${this.config.baseUrl}${dataOriginal}`];
                break;
              }
            }
          } catch {
            // Try next selector
          }
        }
      }

      // Try to get description
      const descSelectors = [
        "#ContentPlaceHolder1_lblDescripcion",
        ".product-description",
        "#product-description",
        ".description",
        "[itemprop='description']",
      ];

      for (const selector of descSelectors) {
        try {
          const desc = page.locator(selector).first();
          if (await desc.count() > 0) {
            const text = await desc.textContent();
            if (text && text.trim().length > 10) {
              detail.description = text.trim();
              break;
            }
          }
        } catch {
          // Try next selector
        }
      }

      // Try to get stock
      const stockSelectors = [
        "#ContentPlaceHolder1_lblStock",
        "#lblStock",
        ".stock",
        "#stock",
        "[itemprop='availability']",
        ".product-stock",
        ".stock-info",
        "span:has-text('Stock')",
      ];

      for (const selector of stockSelectors) {
        try {
          const stock = page.locator(selector).first();
          if (await stock.count() > 0) {
            const text = await stock.textContent();
            if (text) {
              // Check if it says "Sin stock" or "Sin Stock" = no stock
              if (text.toLowerCase().includes("sin stock")) {
                detail.stock = 0;
                break;
              }
              // Check for "consultar" or similar = no stock
              if (text.toLowerCase().includes("consultar") || text.toLowerCase().includes("sin disponibilidad")) {
                detail.stock = 0;
                break;
              }
              // Try to extract a number
              const stockMatch = text.match(/(\d+)/);
              if (stockMatch) {
                detail.stock = parseInt(stockMatch[1], 10);
                break;
              }
            }
          }
        } catch {
          // Try next selector
        }
      }

      return detail;
    } catch (error) {
      console.error(`[Scraper] Error scraping product detail: ${productUrl}`, error);
      return null;
    }
  }

  /**
   * Scrape all products from multiple categories with detail pages and pagination
   */
  async scrapeProducts(page: Page): Promise<RawProduct[]> {
    const allProducts: RawProduct[] = [];

    // Get categories from config - scrape ALL categories now
    const { jotakpCategories } = await import("./config");
    
    // Get categories that have valid IDs (not parent categories)
    const validCategories = jotakpCategories.filter(c => c.idsubrubro1 > 0);

    console.log(`[Scraper] Will scrape ${validCategories.length} categories`);

    for (const category of validCategories) {
      console.log(`[Scraper] Scraping category: ${category.name} (id=${category.idsubrubro1})`);
      
      try {
        // Navigate to category page - start at page 1
        await page.goto(
          `${this.config.baseUrl}/buscar.aspx?idsubrubro1=${category.idsubrubro1}`,
          { waitUntil: "networkidle" }
        );
        
        await this.delay(); // Wait for page to load
        
        let pageNum = 1;
        let hasNextPage = true;
        
        while (hasNextPage) {
          console.log(`[Scraper] Scraping ${category.name} - page ${pageNum}`);
          
          // Scrape products from this page
          const pageProducts = await this.scrapePage(page);
          
          console.log(`[Scraper] Found ${pageProducts.length} products on page ${pageNum}`);
          
          // For each product, visit the detail page to get more info
          for (const product of pageProducts) {
            if (!product.productUrl) continue;
            
            try {
              const detail = await this.scrapeProductDetail(page, product.productUrl);
              
              if (detail) {
                // Merge detail info into product
                if (detail.imageUrls && detail.imageUrls.length > 0) {
                  product.imageUrls = detail.imageUrls;
                }
                if (detail.description) {
                  product.description = detail.description;
                }
                if (detail.stock !== undefined) {
                  product.stock = detail.stock;
                }
              }
            } catch (error) {
              console.error(`[Scraper] Error getting detail for ${product.productUrl}:`, error);
            }
            
            // Add category to product
            product.categories = [category.name];
            
            // Only add products that have stock (or stock is unknown/undefined - keep them for now)
            // Products with stock = 0 or "sin stock" will be filtered out
            if (product.stock === undefined || product.stock === null || product.stock > 0) {
              allProducts.push(product);
            } else {
              console.log(`[Scraper] Skipping product without stock: ${product.name}`);
            }
            
            // Small delay between product detail requests
            await this.delay();
          }
          
          // Check for next page - look for "Siguiente" link that is NOT disabled
          try {
            const nextButton = page.locator("a:has-text('Siguiente')").first();
            const isDisabled = await nextButton.getAttribute("href");
            
            // If href is "#" or undefined/null, the button is disabled (no more pages)
            if (!isDisabled || isDisabled === "#") {
              hasNextPage = false;
              console.log(`[Scraper] No more pages in ${category.name}`);
            } else {
              // Click the next page button
              await nextButton.click();
              await page.waitForLoadState("networkidle");
              await this.delay();
              pageNum++;
            }
          } catch {
            // No next button found - we've reached the end
            hasNextPage = false;
            console.log(`[Scraper] No next page button found for ${category.name}`);
          }
        }
        
      } catch (error) {
        console.error(`[Scraper] Error scraping category ${category.name}:`, error);
      }
    }

    console.log(`[Scraper] Total products scraped (with stock): ${allProducts.length}`);
    return allProducts;
  }

  /**
   * Run the complete scraping pipeline
   */
  async run(): Promise<ScraperResult> {
    const startTime = Date.now();
    const result: ScraperResult = {
      success: false,
      created: 0,
      updated: 0,
      errors: [],
      durationMs: 0,
      timestamp: new Date(),
    };

    let page: Page | null = null;

    try {
      // Initialize browser
      const browser = await this.initBrowser();
      const context = await browser.newContext();
      page = await context.newPage();

      // Step 1: Login
      console.log("[Scraper] Starting login...");
      await this.login(page);

      // Add delay after login
      await this.delay();

      // Step 2: Navigate to products page and scrape
      console.log("[Scraper] Starting to scrape products...");
      const rawProducts = await this.scrapeProducts(page);
      result.errors.push(`Scraped ${rawProducts.length} raw products from website`);

      if (rawProducts.length === 0) {
        result.success = true;
        result.durationMs = Date.now() - startTime;
        return result;
      }

      // Step 4: Transform products
      console.log("[Scraper] Transforming products...");
      const { products, errors } = transformProducts(rawProducts, this.config.supplier);
      result.errors.push(...errors);

      // Step 5: Save to database
      // Note: upsertByExternalId handles both create and update internally
      // For accurate counts, we would need to check before, but for performance
      // we'll just count total products processed
      console.log("[Scraper] Saving products to database...");
      const initialCount = products.length;
      for (const product of products) {
        try {
          await productRepository.upsertByExternalId(product);
        } catch (dbError) {
          const errorMsg = dbError instanceof Error ? dbError.message : "Unknown error";
          result.errors.push(`Failed to save product ${product.name}: ${errorMsg}`);
        }
      }
      // Rough estimate: if upsert succeeded, count as created for simplicity
      // In a real scenario, you'd query before to get accurate counts
      result.created = initialCount - result.errors.filter(e => e.startsWith("Failed")).length;
      result.updated = 0;

      result.success = true;
      console.log(`[Scraper] Completed: ${result.created} created, ${result.updated} updated`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const scraperError = error as ScraperError;

      result.errors.push(`Error: ${message}`);
      console.error("[Scraper] Pipeline failed:", message);

      // Provide more specific error codes
      if (scraperError.code === "AUTH_FAILED") {
        throw error; // Re-throw auth errors
      }
    } finally {
      result.durationMs = Date.now() - startTime;

      // Clean up
      if (page) {
        await page.close();
      }
      await this.closeBrowser();
    }

    return result;
  }
}

/**
 * Create a simple function to run the scraper
 */
export async function runScraper(): Promise<ScraperResult> {
  const scraper = new ScraperService();
  return scraper.run();
}
