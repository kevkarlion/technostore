/**
 * Normalizes text for search indexing and comparison.
 * Must match src/lib/search/normalizer.ts in the main app.
 */
export function normalizeText(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[^\w\s\-\.]/g, "")
    .trim();
}
