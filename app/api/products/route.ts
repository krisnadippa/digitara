import { NextResponse } from "next/server";
import { getMergedProducts } from "@/lib/pricing";
import { getStockSummary } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getMergedProducts();
    const stockSummary = await getStockSummary();

    return NextResponse.json({
      success: true,
      products,
      stockSummary,
    });
  } catch (err) {
    console.error("Error fetching public products:", err);
    return NextResponse.json({ error: "Gagal memuat produk." }, { status: 500 });
  }
}
