// ---------------------------------------------------------------------------
// Client-side singleton cache para la cotización del dólar
// ---------------------------------------------------------------------------

export interface ExchangeRate {
  compra: number;
  venta: number;
  fecha: string;
  moneda: string;
  casa: string;
  nombre: string;
}

let cachedRate: ExchangeRate | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min en cliente

/**
 * Obtiene la cotización oficial del día desde la API interna.
 * Hace cache singleton para no saturar requests.
 */
export async function getExchangeRate(): Promise<ExchangeRate | null> {
  const now = Date.now();

  if (cachedRate && now < cacheExpiresAt) {
    return cachedRate;
  }

  try {
    const res = await fetch("/api/exchange-rate", {
      // Evita cache HTTP del browser para tener datos frescos
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data: ExchangeRate = await res.json();
    cachedRate = data;
    cacheExpiresAt = now + CACHE_TTL_MS;

    return data;
  } catch {
    // Si hay cache vencido, devolverlo antes de fallar
    if (cachedRate) return cachedRate;
    return null;
  }
}

/**
 * Convierte un monto en USD a ARS usando la cotización oficial.
 * Si no hay rate disponible, devuelve el monto original.
 */
export function usdToArs(usdAmount: number, rate: number | null): number {
  if (!rate || rate <= 0) return usdAmount;
  return usdAmount * rate;
}

/**
 * Formatea un monto en ARS con el locale argentino.
 */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
