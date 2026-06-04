// ---------------------------------------------------------------------------
// Server-side helper para obtener la cotización oficial del dólar
// Usa URL absoluta para funcionar desde Server Components (RSC)
// ---------------------------------------------------------------------------

export interface ExchangeRate {
  compra: number;
  venta: number;
  fecha: string;
  moneda: string;
  casa: string;
  nombre: string;
}

/**
 * Obtiene la cotización oficial desde un Server Component.
 * Usa URL absoluta para evitar problemas con fetch relativo en RSC.
 */
export async function getExchangeRateServer(): Promise<ExchangeRate | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window === "undefined"
        ? "http://localhost:3000"
        : window.location.origin);
    const res = await fetch(`${baseUrl}/api/exchange-rate`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
