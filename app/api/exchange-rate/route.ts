import { NextResponse } from "next/server";
import { getExchangeRateServer } from "@/lib/exchange-rate-server";

export async function GET() {
  const rate = await getExchangeRateServer();

  if (!rate) {
    return NextResponse.json(
      { compra: 0, venta: 0, fecha: new Date().toISOString(), moneda: "USD", casa: "oficial", nombre: "Banco Nación" },
      { status: 503 }
    );
  }

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
