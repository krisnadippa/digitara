import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      status: order.status,
      paidAt: order.paidAt,
      emailSent: order.emailSent,
      activationLink: order.status === "PAID" ? order.activationLink : null,
    });
  } catch (err) {
    console.error("Error fetching order status:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
