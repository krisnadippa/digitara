import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getMergedProducts, updateProductPricing } from "@/lib/pricing";
import { getStockSummary } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }

    const products = await getMergedProducts();
    const stockSummary = await getStockSummary();

    return NextResponse.json({
      success: true,
      products,
      stockSummary,
    });
  } catch (err) {
    console.error("Error getting admin products:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }

    const body = await req.json();
    const { productId, price, originalPrice, priceNote, isAvailable } = body;

    if (!productId || price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json(
        { error: "Product ID dan harga jual wajib diisi secara valid." },
        { status: 400 }
      );
    }

    const updated = await updateProductPricing(productId, {
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      priceNote,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
    });

    const products = await getMergedProducts();

    return NextResponse.json({
      success: true,
      message: "Harga & status produk berhasil diperbarui!",
      updated,
      products,
    });
  } catch (err) {
    console.error("Error updating product pricing:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
