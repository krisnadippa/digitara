import { NextResponse } from "next/server";
import { getStockSummary } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getStockSummary();
    return NextResponse.json(
      {
        success: true,
        summary,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (err) {
    console.error("Error fetching stock summary:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data stok." },
      { status: 500 }
    );
  }
}
