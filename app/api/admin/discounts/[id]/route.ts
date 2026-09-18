import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { updateDiscount, deleteDiscount } from "@/lib/discounts";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const updated = await updateDiscount(id, {
      code: body.code,
      name: body.name,
      type: body.type,
      value: body.value !== undefined ? Number(body.value) : undefined,
      minOrder: body.minOrder !== undefined ? Number(body.minOrder) : undefined,
      maxDiscount: body.maxDiscount !== undefined ? (body.maxDiscount ? Number(body.maxDiscount) : undefined) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Kupon diskon tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Kupon ${updated.code} berhasil diperbarui!`,
      discount: updated,
    });
  } catch (err) {
    console.error("Error updating discount:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }

    const { id } = await context.params;
    const deleted = await deleteDiscount(id);

    if (!deleted) {
      return NextResponse.json({ error: "Kupon diskon tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Kupon diskon berhasil dihapus.",
    });
  } catch (err) {
    console.error("Error deleting discount:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
