import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buyerName, buyerEmail, buyerWhatsapp, items, baseAmount, paymentMethod } = body;

    if (!buyerEmail || !items || items.length === 0 || !baseAmount) {
      return NextResponse.json(
        { error: "Data pesanan tidak lengkap." },
        { status: 400 }
      );
    }

    const newOrder = await createOrder({
      buyerName,
      buyerEmail,
      buyerWhatsapp,
      items,
      baseAmount: Number(baseAmount),
      paymentMethod: paymentMethod || "qris",
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
    });
  } catch (err: unknown) {
    console.error("Error creating order:", err);
    return NextResponse.json(
      { error: "Gagal membuat pesanan." },
      { status: 500 }
    );
  }
}
