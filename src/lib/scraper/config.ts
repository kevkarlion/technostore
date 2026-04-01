import { getEnv } from "@/config/env";
import type { ScraperConfig, ScraperSelectors, ScraperCategory } from "./types";

/**
 * Available categories from Jotakp (Cappelletti Informática)
 * These were discovered during site exploration
 */
export const jotakpCategories: ScraperCategory[] = [
  { id: "almacenamiento", name: "Almacenamiento", idsubrubro1: 0 },
  { id: "carry-caddy-disk", name: "Carry-Caddy Disk", idsubrubro1: 100 },
  { id: "cd-dvd-bluray", name: "CD-DVD-BluRay-Dual Layer", idsubrubro1: 13 },
  { id: "discos-externos", name: "Discos Externos", idsubrubro1: 14 },
  { id: "discos-hdd", name: "Discos HDD", idsubrubro1: 69 },
  { id: "discos-m2", name: "Discos M.2", idsubrubro1: 157 },
  { id: "discos-ssd", name: "Discos SSD", idsubrubro1: 156 },
  { id: "memorias-flash", name: "Memorias Flash", idsubrubro1: 12 },
  { id: "pendrive", name: "Pendrive", idsubrubro1: 5 },
  { id: "memorias", name: "Memorias", idsubrubro1: 1 },
  { id: "audio", name: "Audio", idsubrubro1: 0 },
  { id: "auricular-bluetooth", name: "Auricular Bluetooth", idsubrubro1: 149 },
  { id: "auricular-cableado", name: "Auricular Cableado", idsubrubro1: 36 },
  { id: "parlantes", name: "Parlantes", idsubrubro1: 35 },
  { id: "computadoras", name: "Computadoras", idsubrubro1: 0 },
  { id: "notebooks", name: "Notebooks", idsubrubro1: 56 },
  { id: "pc", name: "PC", idsubrubro1: 60 },
  { id: "mini-pc", name: "Mini Pc", idsubrubro1: 59 },
  { id: "impresion", name: "Impresión", idsubrubro1: 0 },
  { id: "impresoras", name: "Impresoras", idsubrubro1: 17 },
  { id: "perifericos", name: "Periféricos", idsubrubro1: 0 },
  { id: "mouse", name: "Mouse", idsubrubro1: 43 },
  { id: "teclados", name: "Teclados", idsubrubro1: 44 },
  { id: "webcams", name: "Webcams", idsubrubro1: 67 },
  { id: "gamer", name: "Gamer", idsubrubro1: 0 },
  { id: "mouse-gamer", name: "Mouse Gamer", idsubrubro1: 152 },
  { id: "teclado-gamer", name: "Teclado Gamer", idsubrubro1: 153 },
  { id: "componentes", name: "Componentes", idsubrubro1: 0 },
  { id: "microprocesadores", name: "Microprocesadores", idsubrubro1: 6 },
  { id: "motherboard", name: "Motherboard", idsubrubro1: 7 },
  { id: "placas-de-video", name: "Placas de Video", idsubrubro1: 8 },
  { id: "fuentes", name: "Fuentes", idsubrubro1: 9 },
  { id: "gabinetes", name: "Gabinetes", idsubrubro1: 10 },
];

/**
 * Default selectors for Jotakp (Cappelletti Informática) supplier
 * Updated after site exploration
 */
const defaultSelectors: ScraperSelectors = {
  login: {
    formSelector: "#form1",
    emailInputSelector: "#TxtEmail",
    passwordInputSelector: "#TxtPass1",
    submitButtonSelector: "#BtnIngresar",
  },
  productList: {
    containerSelector: "body",
    itemSelector: "a[href*='articulo.aspx?id=']",
    nextPageSelector: "",
  },
  product: {
    nameSelector: "", // Text content of the link contains the name
    priceSelector: "", // Price is in the link text
    descriptionSelector: "",
    imageSelector: "img",
    skuSelector: "",
    stockSelector: "",
    linkSelector: "a[href*='articulo.aspx?id=']",
  },
  pagination: {
    pageParam: "idsubrubro1",
    maxPages: 20, // Limit to prevent infinite loops
  },
};

/**
 * Get scraper configuration from environment variables
 */
export function getScraperConfig(): ScraperConfig {
  const env = getEnv();

  if (!env.SUPPLIER_URL) {
    throw new Error("SUPPLIER_URL is required in environment variables");
  }
  if (!env.SUPPLIER_LOGIN_URL) {
    throw new Error("SUPPLIER_LOGIN_URL is required in environment variables");
  }
  if (!env.SUPPLIER_EMAIL) {
    throw new Error("SUPPLIER_EMAIL is required in environment variables");
  }
  if (!env.SUPPLIER_PASSWORD) {
    throw new Error("SUPPLIER_PASSWORD is required in environment variables");
  }

  // Extract supplier name from URL (e.g., "example.com" -> "example")
  const supplierName = env.SUPPLIER_URL
    .replace(/^https?:\/\//, "")
    .replace(/\..*/, "")
    .toLowerCase();

  return {
    supplier: supplierName,
    baseUrl: env.SUPPLIER_URL,
    loginUrl: env.SUPPLIER_LOGIN_URL,
    email: env.SUPPLIER_EMAIL,
    password: env.SUPPLIER_PASSWORD,
    delayMs: env.SUPPLIER_DELAY_MS || 5000,
    selectors: defaultSelectors,
  };
}

/**
 * Update selectors after exploring the site
 * This mutates the defaultSelectors object
 */
export function updateSelectors(newSelectors: ScraperSelectors): void {
  defaultSelectors.login = { ...defaultSelectors.login, ...newSelectors.login };
  defaultSelectors.productList = { ...defaultSelectors.productList, ...newSelectors.productList };
  defaultSelectors.product = { ...defaultSelectors.product, ...newSelectors.product };
  defaultSelectors.pagination = { ...defaultSelectors.pagination, ...newSelectors.pagination };
}
