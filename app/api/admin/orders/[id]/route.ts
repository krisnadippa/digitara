import { NextRequest, NextResponse } from "next/server";
import { markOrderAsPaid, rejectOrder, deleteOrder, updateOrderEmailSent, getOrderById } from "@/lib/orders";
import { allocateStockForOrder, releaseStockForOrder } from "@/lib/stocks";
import { sendActivationEmail } from "@/lib/email";
import { isAuthenticatedAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login admin terlebih dahulu." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // 'approve' | 'reject'

    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    if (action === "approve") {
      let finalActivationLink = existingOrder.activationLink;

      // Alokasikan link aktivasi dari stok jika belum berstatus PAID
      if (existingOrder.status !== "PAID") {
        const allocResult = await allocateStockForOrder(
          existingOrder.orderId,
          existingOrder.buyerEmail,
          existingOrder.items
        );

        if (!allocResult.success) {
          return NextResponse.json(
            { error: allocResult.error || "Gagal mengalokasikan stok link aktivasi." },
            { status: 400 }
          );
        }

        if (allocResult.allLinks.length > 0) {
          finalActivationLink = allocResult.allLinks.length === 1 
            ? allocResult.allLinks[0]
            : allocResult.allLinks.join("\n");
        }
      }

      const paidOrder = await markOrderAsPaid(id, finalActivationLink);
      if (!paidOrder) {
        return NextResponse.json({ error: "Gagal memperbarui status pesanan." }, { status: 500 });
      }

      // Automatically push activation email to buyer via Gmail SMTP
      const emailResult = await sendActivationEmail(paidOrder);
      await updateOrderEmailSent(id, emailResult.emailSent);

      return NextResponse.json({
        success: true,
        message: emailResult.emailSent
          ? `Pesanan #${id} berhasil di-ACC & link aktivasi (${finalActivationLink.split('\n')[0]}...) telah dikirim ke ${paidOrder.buyerEmail}!`
          : `Pesanan #${id} di-ACC & link aktivasi berhasil dialokasikan, namun email gagal terkirim (cek SMTP).`,
        order: await getOrderById(id),
      });
    } else if (action === "reject") {
      // Kembalikan stok yang mungkin sempat teralokasi
      await releaseStockForOrder(id);

      const rejected = await rejectOrder(id);
      if (!rejected) {
        return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Pesanan #${id} telah ditolak & stok dikembalikan ke gudang.`,
        order: rejected,
      });
    }

    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  } catch (err: unknown) {
    console.error("Error managing order:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login admin terlebih dahulu." },
        { status: 401 }
      );
    }

    const { id } = await params;
    await releaseStockForOrder(id);
    const deleted = await deleteOrder(id);
    if (!deleted) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Pesanan #${id} berhasil dihapus.` });
  } catch (err) {
    console.error("Error deleting order:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
