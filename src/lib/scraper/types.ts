/**
 * Raw product data extracted from the supplier website
 * This represents the unprocessed data before transformation
 */
export interface RawProduct {
  /** Product ID from the supplier website */
  externalId: string;
  /** Product name/title */
  name: string;
  /** Product description */
  description?: string;
  /** Product price as string (may include currency symbols, commas) */
  priceRaw: string;
  /** Product price with IVA (tax) */
  priceWithIvaRaw?: string;
  /** Product SKU */
  sku?: string;
  /** Stock quantity as string (may include text like "in stock", "out of stock") */
  stockRaw?: string;
  /** Stock quantity as number (from detail page) */
  stock?: number;
  /** Image URLs found on the product */
  imageUrls: string[];
  /** Product categories/breadcrumbs */
  categories: string[];
  /** URL to the product detail page */
  productUrl?: string;
  /** Raw HTML element for debugging */
  rawElement?: unknown;
}

/**
 * Category configuration for scraping multiple categories
 */
export interface ScraperCategory {
  id: string;
  name: string;
  idsubrubro1: number;
  parentId: string | null; // Para jerarquía: parent slug o null si es categoría padre
  parent?: string; // Optional: parent category name for reference
}

/**
 * Selectors configuration for the supplier website
 * These will be updated after exploring the actual site
 */
export interface ScraperSelectors {
  /** Login form selectors */
  login: {
    formSelector: string;
    emailInputSelector: string;
    passwordInputSelector: string;
    submitButtonSelector: string;
  };
  /** Product list selectors */
  productList: {
    containerSelector: string;
    itemSelector: string;
    nextPageSelector: string;
  };
  /** Product card/item selectors */
  product: {
    nameSelector: string;
    priceSelector: string;
    descriptionSelector?: string;
    imageSelector: string;
    skuSelector?: string;
    stockSelector?: string;
    linkSelector: string;
  };
  /** Pagination */
  pagination: {
    pageParam: string; // e.g., "page" for ?page=2
    maxPages?: number;
  };
}

/**
 * Configuration for the scraper
 */
export interface ScraperConfig {
  supplier: string;
  baseUrl: string;
  loginUrl: string;
  email: string;
  password: string;
  delayMs: number;
  selectors: ScraperSelectors;
}

/**
 * Result of a scraper execution
 */
export interface ScraperResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
  durationMs: number;
  timestamp: Date;
}

/**
 * Scraper error types
 */
export class ScraperError extends Error {
  constructor(
    message: string,
    public code: "AUTH_FAILED" | "CONNECTION_ERROR" | "PARSE_ERROR" | "NETWORK_ERROR",
    public originalError?: unknown
  ) {
    super(message);
    this.name = "ScraperError";
  }
}

/**
 * Request to run scraper for a specific category
 */
export interface ScraperRunRequest {
  /** Category ID to scrape (e.g., "carry-caddy-disk", "memorias", etc.) */
  categoryId?: string;
  /** Specific idsubrubro1 to scrape (overrides categoryId) */
  idsubrubro1?: number;
  /** Source of the request (e.g., "manual", "cron", "api") */
  source?: string;
}

/**
 * Status of a scraper run
 */
export type ScraperRunStatus = "in_progress" | "completed" | "failed" | "stale";

/**
 * Checkpoint data for resume functionality
 * Saved after each category/page to enable resume on crash
 */
export interface CheckpointData {
  /** Last category that was being processed */
  lastCategoryId: string | null;
  lastCategoryName: string | null;
  /** Index in categoriesToProcess array */
  currentCategoryIndex: number;
  /** Last page number scraped in current category */
  lastPageNumber: number;
  /** Last product ID processed (for granular resume) */
  lastProductId: string | null;
  /** Offset of products in current page */
  lastProductOffset: number;
  /** Number of products scraped so far in this run */
  productsScraped: number;
  /** Number of products saved to DB so far */
  productsSaved: number;
}

/**
 * Statistics for a completed run
 */
export interface RunStats {
  productsScraped: number;
  productsSaved: number;
  durationMs: number;
}

/**
 * Data transfer object for creating a new scraper run
 */
export interface CreateScraperRunDTO {
  source?: string;
  categoryId?: string;
  idsubrubro1?: number;
  categoriesToProcess: string[];
}

/**
 * Scraper run entity - represents a single execution of the scraper
 * with checkpoint data for resume functionality
 */
export interface ScraperRun {
  _id?: import("mongodb").ObjectId;
  runId: string;
  status: ScraperRunStatus;
  source?: string;
  categoryId?: string;
  requestedIdsubrubro1?: number;
  categoriesToProcess: string[];
  currentCategoryIndex: number;
  // Checkpoint fields
  lastCategoryId: string | null;
  lastCategoryName: string | null;
  lastPageNumber: number;
  lastProductId: string | null;
  lastProductOffset: number;
  // Stats
  productsScraped: number;
  productsSaved: number;
  resumeCount: number;
  // Error tracking
  errorMessage?: string;
  // Timestamps
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}
