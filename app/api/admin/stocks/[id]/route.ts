import { NextRequest, NextResponse } from "next/server";
import { deleteStockItem } from "@/lib/stocks";
import { isAuthenticatedAdmin } from "@/lib/auth";

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
    const deleted = await deleteStockItem(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Stok tidak ditemukan atau sudah berstatus TERPAKAI (tidak dapat dihapus)." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Stok #${id} berhasil dihapus.`,
    });
  } catch (err) {
    console.error("Error deleting stock:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
