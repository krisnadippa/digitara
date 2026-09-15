import { NextRequest, NextResponse } from "next/server";
import { markOrderWaitingConfirmation, getOrderById } from "@/lib/orders";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await markOrderWaitingConfirmation(id);

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil ditandai menunggu konfirmasi admin.",
      order,
    });
  } catch (err) {
    console.error("Error confirming order:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
