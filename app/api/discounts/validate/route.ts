import { NextRequest, NextResponse } from "next/server";
import { getDiscountByCode, calculateDiscountAmount } from "@/lib/discounts";

// Endpoint validasi kupon promo
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;
    const rawAmount = body.baseAmount ?? body.orderAmount ?? body.amount;
    const amount = Number(rawAmount) || 0;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { valid: false, error: "Silakan masukkan kode kupon." },
        { status: 400 }
      );
    }

    const discount = await getDiscountByCode(code.trim());
    if (!discount) {
      return NextResponse.json(
        { valid: false, error: "Kode kupon tidak valid atau tidak ditemukan." },
        { status: 404 }
      );
    }

    const result = calculateDiscountAmount(discount, amount);

    if (!result.isValid) {
      return NextResponse.json(
        { valid: false, error: result.error || "Kupon tidak memenuhi syarat." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      discountAmount: result.discountAmount,
      finalAmount: Math.max(0, amount - result.discountAmount),
      discount: {
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        maxDiscount: discount.maxDiscount,
        minOrder: discount.minOrder,
      },
    });
  } catch (err) {
    console.error("Error validating discount:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
