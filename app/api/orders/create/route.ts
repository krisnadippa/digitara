import { NextRequest, NextResponse } from "next/server";
import { createOrder, OrderItem } from "@/lib/orders";
import { getMergedProducts } from "@/lib/pricing";
import { getDiscountByCode, calculateDiscountAmount, recordDiscountUsage } from "@/lib/discounts";

// Helper validasi email sederhana
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buyerName, buyerEmail, buyerWhatsapp, items, discountCode } = body;

    // Validasi data pembeli
    if (!buyerEmail || typeof buyerEmail !== "string" || !isValidEmail(buyerEmail.trim())) {
      return NextResponse.json(
        { error: "Format email pembeli tidak valid." },
        { status: 400 }
      );
    }

    if (!buyerName || typeof buyerName !== "string" || buyerName.trim().length < 2) {
      return NextResponse.json(
        { error: "Nama pembeli wajib diisi minimal 2 karakter." },
        { status: 400 }
      );
    }

    const cleanName = buyerName.trim().slice(0, 100);
    const cleanEmail = buyerEmail.trim().toLowerCase().slice(0, 255);
    const cleanWhatsapp = typeof buyerWhatsapp === "string" ? buyerWhatsapp.trim().replace(/[^0-9+]/g, "").slice(0, 25) : "";

    // Validasi daftar item pesanan
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Item pesanan wajib diisi minimal 1 produk." },
        { status: 400 }
      );
    }

    if (items.length > 20) {
      return NextResponse.json(
        { error: "Jumlah jenis item melebihi batas wajar." },
        { status: 400 }
      );
    }

    const currentCatalog = await getMergedProducts();
    const validatedItems: OrderItem[] = [];
    let calculatedBaseAmount = 0;

    for (const item of items) {
      if (!item || typeof item !== "object") continue;

      const productId = String(item.id || "");
      const productCatalog = currentCatalog.find((p) => p.id === productId);

      if (!productCatalog) {
        return NextResponse.json(
          { error: `Produk dengan ID "${productId}" tidak valid atau sudah tidak tersedia.` },
          { status: 400 }
        );
      }

      if (productCatalog.isAvailable === false) {
        return NextResponse.json(
          { error: `Produk "${productCatalog.name}" sedang habis stok.` },
          { status: 400 }
        );
      }

      const quantity = Math.max(1, Math.min(50, Math.floor(Number(item.quantity) || 1)));
      const itemPrice = productCatalog.price;

      calculatedBaseAmount += itemPrice * quantity;

      validatedItems.push({
        id: productCatalog.id,
        name: productCatalog.name,
        duration: productCatalog.duration,
        price: itemPrice,
        image: productCatalog.image,
        quantity,
      });
    }

    if (validatedItems.length === 0 || calculatedBaseAmount <= 0) {
      return NextResponse.json(
        { error: "Tidak ada produk valid dalam keranjang pesanan." },
        { status: 400 }
      );
    }

    // Validasi kupon diskon jika ada
    let discountAmount = 0;
    let appliedDiscountCode: string | undefined = undefined;

    if (discountCode && typeof discountCode === "string" && discountCode.trim()) {
      const discount = await getDiscountByCode(discountCode.trim());
      if (discount) {
        const check = calculateDiscountAmount(discount, calculatedBaseAmount);
        if (check.isValid) {
          discountAmount = check.discountAmount;
          appliedDiscountCode = discount.code;
          await recordDiscountUsage(discount.code);
        }
      }
    }

    // Buat pesanan baru dengan harga terverifikasi server & hanya metode QRIS
    const newOrder = await createOrder({
      buyerName: cleanName,
      buyerEmail: cleanEmail,
      buyerWhatsapp: cleanWhatsapp,
      items: validatedItems,
      baseAmount: calculatedBaseAmount,
      paymentMethod: "qris",
      discountAmount,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      discountApplied: appliedDiscountCode ? { code: appliedDiscountCode, amount: discountAmount } : undefined,
    });
  } catch (err: unknown) {
    console.error("Error creating order:", err);
    return NextResponse.json(
      { error: "Gagal membuat pesanan." },
      { status: 500 }
    );
  }
}
