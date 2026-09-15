import { NextRequest, NextResponse } from "next/server";
import { getAllStocks, getStockSummary, addStockItems } from "@/lib/stocks";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { products } from "@/data/products";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login admin terlebih dahulu." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");

    const allStocks = await getAllStocks();
    const summary = await getStockSummary();

    let filtered = allStocks;
    if (productId && productId !== "all") {
      filtered = filtered.filter((s) => s.productId === productId);
    }
    if (status && status !== "all") {
      filtered = filtered.filter((s) => s.status === status);
    }

    return NextResponse.json({
      success: true,
      stocks: filtered,
      totalCount: allStocks.length,
      summary,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        duration: p.duration,
        image: p.image,
      })),
    });
  } catch (err) {
    console.error("Error getting admin stocks:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login admin terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, links, notes } = body;

    if (!productId) {
      return NextResponse.json({ error: "Pilih produk terlebih dahulu." }, { status: 400 });
    }

    const product = products.find((p) => p.id === productId);
    const productName = product ? product.name : productId;

    let linkArray: string[] = [];
    if (Array.isArray(links)) {
      linkArray = links;
    } else if (typeof links === "string") {
      linkArray = links.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
    }

    if (linkArray.length === 0) {
      return NextResponse.json(
        { error: "Masukkan minimal 1 link aktivasi." },
        { status: 400 }
      );
    }

    const created = await addStockItems(productId, productName, linkArray, notes);
    const summary = await getStockSummary();

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan ${created.length} stok link aktivasi untuk ${productName}!`,
      addedCount: created.length,
      items: created,
      summary,
    });
  } catch (err) {
    console.error("Error adding admin stocks:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
