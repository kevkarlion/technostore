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
