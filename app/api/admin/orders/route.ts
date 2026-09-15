import { NextRequest, NextResponse } from "next/server";
import { getAllOrders } from "@/lib/orders";
import { isAuthenticatedAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login admin terlebih dahulu." },
        { status: 401 }
      );
    }

    const orders = await getAllOrders();

    const stats = {
      totalOrders: orders.length,
      waitingConfirmation: orders.filter((o) => o.status === "WAITING_CONFIRMATION").length,
      paid: orders.filter((o) => o.status === "PAID").length,
      pending: orders.filter((o) => o.status === "PENDING").length,
      totalRevenue: orders
        .filter((o) => o.status === "PAID")
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };

    return NextResponse.json({
      success: true,
      stats,
      orders,
    });
  } catch (err: unknown) {
    console.error("Error getting admin orders:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
