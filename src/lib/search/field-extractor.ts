import { normalizeText } from "./normalizer";

const KNOWN_BRANDS = new Set([
  "kingston", "sandisk", "crucial", "samsung", "wd", "western digital",
  "seagate", "toshiba", "lexar", "pny", "adata", "teamgroup", "silicon power",
  "logitech", "redragon", "hyperx", "razer", "corsair", "steelseries",
  "jbl", "sony", "xiaomi", "philips", "lg", "asus", "msi", "gigabyte",
  "kolke", "ugreen", "netmak", "nisuta", "fantech", "trust", "genius",
  "nvidia", "amd", "intel", "apple", "lenovo", "hp", "dell", "acer",
  "cooler master", "thermaltake", "evga", "be quiet", "nzxt",
  "tp-link", "netgear", "ubiquiti", "mikrotik",
  "turtle beach", "plantronics",
  "edifier", "soundcore", "anker", "bose", "sennheiser", "shure",
]);

const CAPACITY_PATTERN = /^(\d+(?:\.\d+)?)\s*(gb|tb|mb|pb)$/i;
const CAPACITY_NUMBER = /^\d+(?:\.\d+)?$/;
const CAPACITY_UNIT = /^(gb|tb|mb|pb)$/i;

function mergeCapacityPairs(words: string[]): { text: string; indices: number[] }[] {
  const merged: { text: string; indices: number[] }[] = [];
  let i = 0;
  while (i < words.length) {
    if (
      i + 1 < words.length &&
      CAPACITY_NUMBER.test(words[i]) &&
      CAPACITY_UNIT.test(words[i + 1])
    ) {
      merged.push({
        text: `${words[i]}${words[i + 1].toLowerCase()}`,
        indices: [i, i + 1],
      });
      i += 2;
    } else {
      merged.push({ text: words[i], indices: [i] });
      i++;
    }
  }
  return merged;
}

const COMPOUND_TYPE_PATTERNS: [RegExp, string][] = [
  [/(?:memoria\s*micro\s*sd|memoria\s*microsd|micro\s*sd|microsd|tarjeta\s*sd|sd\s*card)/i, "microsd"],
  [/(?:pendrive|memoria\s*usb|flash\s*drive)/i, "pendrive"],
  [/(?:disco\s*solido|solid\s*state)/i, "ssd"],
  [/(?:disco\s*mecanico|disco\s*duro)/i, "hdd"],
  [/(?:placa\s*de\s*video|tarjeta\s*de\s*video)/i, "gpu"],
  [/(?:camara\s*web)/i, "webcam"],
  [/(?:power\s*supply)/i, "fuente"],
  [/(?:memoria\s*ram)/i, "ram"],
];

const SINGLE_TYPE_PATTERNS: [RegExp, string][] = [
  [/(?:memoria|memory)/i, "ram"],
  [/(?:ram)/i, "ram"],
  [/(?:microsd)/i, "microsd"],
  [/(?:ssd)/i, "ssd"],
  [/(?:hdd)/i, "hdd"],
  [/(?:gpu|grafica)/i, "gpu"],
  [/(?:procesador|cpu|processor)/i, "cpu"],
  [/(?:monitor|pantalla|display)/i, "monitor"],
  [/(?:teclado|keyboard)/i, "teclado"],
  [/(?:mouse|raton)/i, "mouse"],
  [/(?:auricular|headset|headphone)/i, "auricular"],
  [/(?:webcam)/i, "webcam"],
  [/(?:base|gabinete|case)/i, "gabinete"],
  [/(?:fuente|psu)/i, "fuente"],
];

const FORM_FACTOR_PATTERNS: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/^m\.2$/i, "m.2"],
  [/^(?:2\.5|3\.5)(?:\s*(?:inch|pulgada|"))?$/i, (m) => m[0].replace(/\./g, "").replace(/".*/, "").trim()],
  [/^ddr[345]?$/i, (m) => m[0].toLowerCase()],
  [/^sata\s*(?:iii|3)?$/i, "sata3"],
  [/^nvme$/i, "nvme"],
  [/^pcie$/i, "pcie"],
];

export interface ExtractedFields {
  brand: string | null;
  productType: string | null;
  capacity: string | null;
  formFactor: string | null;
  model: string | null;
}

export function extractFields(name: string): ExtractedFields {
  const normalized = normalizeText(name);
  const words = normalized.split(/\s+/).filter(Boolean);
  const consumed = new Set<number>();

  let brand: string | null = null;
  let productType: string | null = null;
  let capacity: string | null = null;
  let formFactor: string | null = null;
  let model: string | null = null;

  // Priority 1: Capacity — merge adjacent number+unit pairs first
  const mergedWords = mergeCapacityPairs(words);
  for (const merged of mergedWords) {
    const match = merged.text.match(CAPACITY_PATTERN);
    if (match) {
      capacity = `${match[1]}${match[2].toLowerCase()}`;
      for (const idx of merged.indices) {
        consumed.add(idx);
      }
      break;
    }
  }

  // Priority 2: Form factor
  for (let i = 0; i < words.length; i++) {
    if (consumed.has(i)) continue;
    for (const [pattern, value] of FORM_FACTOR_PATTERNS) {
      const match = words[i].match(pattern);
      if (match) {
        formFactor = typeof value === "function" ? value(match) : value;
        consumed.add(i);
        break;
      }
    }
    if (formFactor) break;
  }

  // Priority 3: Type — compound patterns first, then single-word
  for (const [pattern, typeValue] of COMPOUND_TYPE_PATTERNS) {
    if (pattern.test(normalized)) {
      productType = typeValue;
      for (let i = 0; i < words.length; i++) {
        if (consumed.has(i)) continue;
        if (pattern.test(words[i])) {
          consumed.add(i);
          continue;
        }
        // Test triple: words[i] + " " + words[i+1] + " " + words[i+2]
        if (i + 2 < words.length && !consumed.has(i + 1) && !consumed.has(i + 2)) {
          const triple = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          if (pattern.test(triple)) {
            consumed.add(i);
            consumed.add(i + 1);
            consumed.add(i + 2);
            continue;
          }
        }
        // Test pair: words[i] + " " + words[i+1]
        if (i + 1 < words.length && !consumed.has(i + 1)) {
          const pair = `${words[i]} ${words[i + 1]}`;
          if (pattern.test(pair)) {
            consumed.add(i);
            consumed.add(i + 1);
          }
        }
      }
      break;
    }
  }

  if (!productType) {
    for (let i = 0; i < words.length; i++) {
      if (consumed.has(i)) continue;
      for (const [pattern, typeValue] of SINGLE_TYPE_PATTERNS) {
        if (pattern.test(words[i])) {
          productType = typeValue;
          consumed.add(i);
          break;
        }
      }
      if (productType) break;
    }
  }

  // Priority 4: Brand
  let brandIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (consumed.has(i)) continue;
    if (KNOWN_BRANDS.has(words[i])) {
      brand = words[i];
      brandIndex = i;
      consumed.add(i);
      break;
    }
  }

  // Priority 5: Model — unconsumed tokens after the brand form the model name
  const MODEL_NOISE = new Set([
    "clase", "velocidad", "ranura", "slot", "interfaz", "conexion", "color",
    "nuevo", "nueva", "pack", "kit", "juego", "para", "con", "sin", "tipo",
    "mbs", "mbps", "ghz", "mhz", "rpm",
  ]);
  const MODEL_ALPHA = /^[a-z][a-z\-]*$/i;
  const modelParts: string[] = [];
  const startIdx = brandIndex >= 0 ? brandIndex + 1 : 0;
  for (let i = startIdx; i < words.length; i++) {
    if (consumed.has(i)) continue;
    if (MODEL_NOISE.has(words[i])) continue;
    if (!MODEL_ALPHA.test(words[i])) continue;
    if (words[i].length < 2) continue;
    modelParts.push(words[i]);
  }
  if (modelParts.length > 0) {
    model = modelParts.join(" ");
  }

  return { brand, productType, capacity, formFactor, model };
}
