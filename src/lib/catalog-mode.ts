/**
 * isCatalogMode - Feature flag for temporary catalog-only mode
 *
 * When enabled, the store behaves as a product catalog without prices
 * or cart functionality. Purchase intent is routed to WhatsApp.
 *
 * Toggle by setting NEXT_PUBLIC_CATALOG_MODE=true|false in .env.local
 * Rebuild required to pick up changes (Next.js inlines public env vars).
 */
export function isCatalogMode(): boolean {
  return process.env.NEXT_PUBLIC_CATALOG_MODE === "true";
}
