import { chromium, type Browser, type Page } from "playwright";
import { getScraperConfig } from "./config";
import { transformProducts } from "./data-transformer";
import { downloadProductImages } from "./image-downloader";
import { productRepository } from "@/api/repository/product.repository";
import { scraperRunRepository } from "@/api/repository/scraper-run.repository";
import type { ScraperConfig, ScraperResult, RawProduct, ScraperRunRequest, ScraperRun, CheckpointData } from "./types";
import { ScraperError } from "./types";

export class ScraperService {
  private browser: Browser | null = null;
  private config: ScraperConfig;
  private request: ScraperRunRequest;
  private currentRun: ScraperRun | null = null;
  private currentCategoryIndex = 0;
  private currentPageNum = 1;
  private productsScrapedCount = 0;
  private productsSavedCount = 0;

  constructor(config?: ScraperConfig, request?: ScraperRunRequest) {
    this.config = config || getScraperConfig();
    this.request = request || {};
  }

  /**
   * Initialize the browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      if (this.browser) {
        // Browser exists but is closed, clean up
        try {
          await this.browser.close();
        } catch {
          // Ignore if already closed
        }
        this.browser = null;
      }
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
  }

  /**
   * Check if browser is still connected, reconnect if needed
   */
  private async ensureBrowser(page: Page): Promise<Page> {
    try {
      // Try to check if browser is still alive
      if (!this.browser || !this.browser.isConnected()) {
        console.log("[Scraper] Browser disconnected, reconnecting...");
        await this.reconnect(page);
      }
      return page;
    } catch {
      console.log("[Scraper] Browser error, reconnecting...");
      await this.reconnect(page);
      return page;
    }
  }

  /**
   * Reconnect browser and re-login
   */
  private async reconnect(page: Page): Promise<Page> {
    // Close existing resources
    try {
      if (page) await page.close();
    } catch {
      // Ignore
    }
    await this.closeBrowser();

    // Reinitialize
    const browser = await this.initBrowser();
    const context = await browser.newContext();
    const newPage = await context.newPage();

    // Re-login
    console.log("[Scraper] Re-logging in after reconnect...");
    await this.login(newPage);
    await this.delay();

    return newPage;
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
          productUrl: href.startsWith("http") ? href : `${this.config.baseUrl}/${href}`,
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
      // Ensure URL is complete
      const fullUrl = productUrl.startsWith("http") 
        ? productUrl 
        : `${this.config.baseUrl}/${productUrl}`;
      
      await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 15000 });
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
   * Can filter by specific category or idsubrubro1
   * Supports resume from checkpoint
   */
  async scrapeProducts(page: Page, categoriesToProcess: { id: string; name: string; idsubrubro1: number }[]): Promise<RawProduct[]> {
    const allProducts: RawProduct[] = [];

    console.log(`[Scraper] Will scrape ${categoriesToProcess.length} category(ies)`);

    for (let catIndex = 0; catIndex < categoriesToProcess.length; catIndex++) {
      const category = categoriesToProcess[catIndex];
      
      // Update current category index for checkpoint
      this.currentCategoryIndex = catIndex;
      
      console.log(`[Scraper] Scraping category: ${category.name} (id=${category.idsubrubro1})`);
      
      try {
        // Navigate to category page - start at page (from checkpoint or 1)
        const startPage = (catIndex === this.currentCategoryIndex && this.currentPageNum > 1) 
          ? this.currentPageNum 
          : 1;
        
        let pageNum = startPage;
        let hasNextPage = true;
        
        await page.goto(
          `${this.config.baseUrl}/buscar.aspx?idsubrubro1=${category.idsubrubro1}&pag=${pageNum}`,
          { waitUntil: "networkidle" }
        );
        
        while (hasNextPage) {
          console.log(`[Scraper] Scraping ${category.name} - page ${pageNum}`);
          
          // Save checkpoint before scraping page
          await this.saveCheckpoint(category, pageNum);
          
          // Scrape products from this page
          const pageProducts = await this.scrapePage(page);
          
          console.log(`[Scraper] Found ${pageProducts.length} products on page ${pageNum}`);
          
          // For each product, visit the detail page to get more info
          for (const product of pageProducts) {
            if (!product.productUrl) continue;
            
            try {
              // Check/reconnect browser before each detail request
              page = await this.ensureBrowser(page);
              
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
            
            // Add category to product - use the category ID (slug) not the name
            // This matches the category slug in the DB (e.g., "carry-caddy-disk")
            product.categories = [category.id];
            
            // Only add products that have stock (or stock is unknown/undefined - keep them for now)
            // Products with stock = 0 or "sin stock" will be filtered out
            if (product.stock === undefined || product.stock === null || product.stock > 0) {
              allProducts.push(product);
              this.productsScrapedCount++;
            } else {
              console.log(`[Scraper] Skipping product without stock: ${product.name}`);
            }
            
            // Small delay between product detail requests
            await this.delay();
          }
          
          // Check for next page - look for pagination nav
          try {
            // Check/reconnect before next page
            page = await this.ensureBrowser(page);
            
            // Try multiple selectors for the next page button
            const nextButtonSelectors = [
              "a:has-text('Siguiente')",
              "a.page-link:has-text('Siguiente')",
              "li.page-item:last-child a",
              "nav[aria-label='Page navigation example'] a:has-text('Siguiente')",
            ];
            
            let nextButton = null;
            let foundSelector = "";
            for (const selector of nextButtonSelectors) {
              const btn = page.locator(selector).first();
              const count = await btn.count();
              console.log(`[Scraper] Trying selector: ${selector}, count: ${count}`);
              if (count > 0) {
                nextButton = btn;
                foundSelector = selector;
                break;
              }
            }
            
            if (!nextButton) {
              hasNextPage = false;
              console.log(`[Scraper] No next page button found for ${category.name}`);
            } else {
              console.log(`[Scraper] Found next button with selector: ${foundSelector}`);
              const isDisabled = await nextButton.getAttribute("disabled");
              const href = await nextButton.getAttribute("href");
              console.log(`[Scraper] href: ${href}, disabled: ${isDisabled}`);
              
              // If disabled or href is "#", no more pages
              if (isDisabled === "disabled" || !href || href === "#") {
                hasNextPage = false;
                console.log(`[Scraper] No more pages in ${category.name}`);
              } else {
                // Navigate to next page using URL with pag parameter
                pageNum++;
                console.log(`[Scraper] Going to page ${pageNum}...`);
                await page.goto(
                  `${this.config.baseUrl}/buscar.aspx?idsubrubro1=${category.idsubrubro1}&pag=${pageNum}`,
                  { waitUntil: "networkidle" }
                );
                await this.delay();
                this.currentPageNum = pageNum;
              }
            }
          } catch (e) {
            // No next button found - we've reached the end
            hasNextPage = false;
            console.log(`[Scraper] Error checking next page: ${e}`);
            console.log(`[Scraper] No next page button found for ${category.name}`);
          }
        }
        
        // Save checkpoint after completing category
        await this.saveCheckpoint(category, pageNum);
        
      } catch (error) {
        console.error(`[Scraper] Error scraping category ${category.name}:`, error);
        // Save checkpoint on error
        await this.saveCheckpoint(category, 1);
      }
    }

    console.log(`[Scraper] Total products scraped (with stock): ${allProducts.length}`);
    return allProducts;
  }

  /**
   * Run the complete scraping pipeline
   * Includes checkpoint system for resume on crash
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
      // Ensure indexes exist
      await scraperRunRepository.ensureIndexes();

      // Step 0: Clean up stale runs (older than 24 hours)
      console.log("[Scraper] Cleaning up stale runs...");
      const cleanedCount = await scraperRunRepository.cleanupStaleRuns(24);
      if (cleanedCount > 0) {
        console.log(`[Scraper] Marked ${cleanedCount} stale run(s) as stale`);
      }

      // Step 0b: Check for incomplete run to resume
      const incompleteRun = await scraperRunRepository.findIncomplete();
      
      // Get categories to process
      const { jotakpCategories } = await import("./config");
      let validCategories = jotakpCategories.filter(c => c.idsubrubro1 > 0);

      // Filter by request
      if (this.request.idsubrubro1 !== undefined) {
        validCategories = validCategories.filter(c => c.idsubrubro1 === this.request.idsubrubro1);
        console.log(`[Scraper] Filtering to idsubrubro1=${this.request.idsubrubro1}`);
      } else if (this.request.categoryId) {
        validCategories = validCategories.filter(c => c.id === this.request.categoryId);
        console.log(`[Scraper] Filtering to categoryId=${this.request.categoryId}`);
      }

      const categoriesToProcess = validCategories.map(c => c.id);

      // Create new run or resume from checkpoint
      if (incompleteRun) {
        console.log(`[Scraper] Resuming from incomplete run ${incompleteRun.runId}`);
        this.currentRun = incompleteRun;
        this.currentCategoryIndex = incompleteRun.currentCategoryIndex;
        this.currentPageNum = incompleteRun.lastPageNumber;
        this.productsScrapedCount = incompleteRun.productsScraped;
        this.productsSavedCount = incompleteRun.productsSaved;
        
        // Increment resume count
        await scraperRunRepository.incrementResumeCount(incompleteRun.runId);
        
        // Update categories to process from the run
        if (incompleteRun.categoriesToProcess.length > 0) {
          // Filter validCategories based on what was being processed
          validCategories = validCategories.slice(this.currentCategoryIndex);
        }
      } else {
        // Create new run
        this.currentRun = await scraperRunRepository.create({
          source: this.request.source,
          categoryId: this.request.categoryId,
          idsubrubro1: this.request.idsubrubro1,
          categoriesToProcess,
        });
        console.log(`[Scraper] Created new run ${this.currentRun.runId}`);
      }

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
      const rawProducts = await this.scrapeProducts(page, validCategories);
      result.errors.push(`Scraped ${rawProducts.length} raw products from website`);

      if (rawProducts.length === 0) {
        result.success = true;
        result.durationMs = Date.now() - startTime;
        // Mark as completed
        if (this.currentRun) {
          await scraperRunRepository.markCompleted(this.currentRun.runId, {
            productsScraped: this.productsScrapedCount,
            productsSaved: this.productsSavedCount,
            durationMs: result.durationMs,
          });
        }
        return result;
      }

      // Step 4: Transform products
      console.log("[Scraper] Transforming products...");
      const { products, errors } = transformProducts(rawProducts, this.config.supplier);
      result.errors.push(...errors);

      // Step 5: Download images for each product
      console.log("[Scraper] Downloading images...");
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (product.imageUrls && product.imageUrls.length > 0) {
          try {
            const localImageUrls = await downloadProductImages(
              product.imageUrls,
              product.supplier,
              product.externalId
            );
            // Use local paths if any were downloaded, otherwise keep original URLs
            if (localImageUrls.length > 0) {
              product.imageUrls = localImageUrls;
            }
            console.log(`[Scraper] Downloaded ${localImageUrls.length} images for ${product.name.substring(0, 30)}...`);
          } catch (imageError) {
            console.error(`[Scraper] Error downloading images for ${product.externalId}:`, imageError);
          }
        }
        // Small delay between products to not saturate the server
        await this.delay();
      }

      // Step 6: Save to database
      // Note: upsertByExternalId handles both create and update internally
      // For accurate counts, we would need to check before, but for performance
      // we'll just count total products processed
      console.log("[Scraper] Saving products to database...");
      const initialCount = products.length;
      for (const product of products) {
        try {
          await productRepository.upsertByExternalId(product);
          this.productsSavedCount++;
        } catch (dbError) {
          const errorMsg = dbError instanceof Error ? dbError.message : "Unknown error";
          result.errors.push(`Failed to save product ${product.name}: ${errorMsg}`);
        }
      }
      // Rough estimate: if upsert succeeded, count as created for simplicity
      // In a real scenario, you'd query before to get accurate counts
      result.created = initialCount - result.errors.filter(e => e.startsWith("Failed")).length;
      result.updated = 0;

      // Mark run as completed
      if (this.currentRun) {
        await scraperRunRepository.markCompleted(this.currentRun.runId, {
          productsScraped: this.productsScrapedCount,
          productsSaved: this.productsSavedCount,
          durationMs: result.durationMs,
        });
      }

      result.success = true;
      console.log(`[Scraper] Completed: ${result.created} created, ${result.updated} updated`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const scraperError = error as ScraperError;

      result.errors.push(`Error: ${message}`);
      console.error("[Scraper] Pipeline failed:", message);

      // Save checkpoint before throwing (if we have a run)
      if (this.currentRun) {
        await scraperRunRepository.updateCheckpoint(this.currentRun.runId, {
          currentCategoryIndex: this.currentCategoryIndex,
          lastPageNumber: this.currentPageNum,
          productsScraped: this.productsScrapedCount,
          productsSaved: this.productsSavedCount,
        });
        await scraperRunRepository.markFailed(this.currentRun.runId, message);
      }

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

  /**
   * Save checkpoint for current progress
   */
  private async saveCheckpoint(category: { id: string; name: string; idsubrubro1: number }, pageNum: number): Promise<void> {
    if (!this.currentRun) return;

    await scraperRunRepository.updateCheckpoint(this.currentRun.runId, {
      lastCategoryId: category.id,
      lastCategoryName: category.name,
      currentCategoryIndex: this.currentCategoryIndex,
      lastPageNumber: pageNum,
      productsScraped: this.productsScrapedCount,
      productsSaved: this.productsSavedCount,
    });
  }
}

/**
 * Create a simple function to run the scraper
 * @param request - Optional request to filter by category
 */
export async function runScraper(request?: ScraperRunRequest): Promise<ScraperResult> {
  const scraper = new ScraperService(undefined, request);
  return scraper.run();
}
