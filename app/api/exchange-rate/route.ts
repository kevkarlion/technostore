import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Cache en memoria del lado servidor
// ---------------------------------------------------------------------------
let cachedRate: { compra: number; venta: number; fecha: string } | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

async function fetchOfficialRate() {
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

    return { compra: 0, venta: 0, fecha: new Date().toISOString() };
  }
}

export async function GET() {
  const rate = await fetchOfficialRate();

  return NextResponse.json(
    { ...rate, moneda: "USD", casa: "oficial", nombre: "Banco Nación" },
    {
      status: rate.venta > 0 ? 200 : 503,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
      },
    }
  );
}
