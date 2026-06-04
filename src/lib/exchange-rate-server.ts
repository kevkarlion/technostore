// ---------------------------------------------------------------------------
// Server-side exchange rate fetching
// Llama directo a dolarapi.com — sin HTTP auto-referencial
// ---------------------------------------------------------------------------

export interface ExchangeRate {
  compra: number;
  venta: number;
  fecha: string;
}

// ---------------------------------------------------------------------------
// Cache en memoria del lado servidor
// ---------------------------------------------------------------------------
let cachedRate: ExchangeRate | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Obtiene la cotización oficial del dólar desde dolarapi.com.
 * Usa cache en memoria del lado servidor (2hs).
 * Puede llamarse desde Server Components RSC o API Routes.
 */
export async function getExchangeRateServer(): Promise<ExchangeRate | null> {
  const now = Date.now();

  if (cachedRate && now < cacheExpiresAt) {
    return cachedRate;
  }

  try {
    const res = await fetch("https://dolarapi.com/v1/dolares", {
      next: { revalidate: 7200 }, // 2h para ISR
    });

    if (!res.ok) throw new Error(`dolarapi responded ${res.status}`);

    const data = await res.json();
    const oficial = data.find(
      (d: { casa: string }) => d.casa === "oficial"
    );

    if (!oficial) throw new Error("No se encontró cotización oficial");

    cachedRate = {
      compra: oficial.compra,
      venta: oficial.venta,
      fecha: oficial.fechaActualizacion,
    };
    cacheExpiresAt = now + CACHE_TTL_MS;

    return cachedRate;
  } catch (err) {
    console.error("[ExchangeRate] Error fetching rate:", err);

    // Si tenemos un cache previo vencido, servirlo igual antes de fallar
    if (cachedRate) return cachedRate;

    return null;
  }
}
