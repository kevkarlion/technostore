import { expand } from "./synonym-dictionary";

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

export function normalizeForSearch(
  input: string,
  expandSynonyms = false
): string {
  const normalized = normalizeText(input);
  if (!expandSynonyms) return normalized;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const expanded = expand(tokens);
  return expanded.join(" ");
}
