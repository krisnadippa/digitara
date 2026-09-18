import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";
import { getAllDiscounts, createDiscount } from "@/lib/discounts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }

    const discounts = await getAllDiscounts();
    return NextResponse.json({
      success: true,
      discounts,
    });
  } catch (err) {
    console.error("Error getting admin discounts:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 401 });
    }

    const body = await req.json();
    const { code, name, type, value, minOrder, maxDiscount, isActive } = body;

    if (!code || typeof code !== "string" || code.trim().length < 2) {
      return NextResponse.json(
        { error: "Kode kupon wajib diisi minimal 2 karakter." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Nama / keterangan kupon wajib diisi." },
        { status: 400 }
      );
    }

    if (type !== "PERCENTAGE" && type !== "FIXED") {
      return NextResponse.json(
        { error: "Tipe diskon harus 'PERCENTAGE' atau 'FIXED'." },
        { status: 400 }
      );
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return NextResponse.json(
        { error: "Nilai diskon harus berupa angka lebih dari 0." },
        { status: 400 }
      );
    }

    if (type === "PERCENTAGE" && numValue > 100) {
      return NextResponse.json(
        { error: "Persentase diskon maksimal 100%." },
        { status: 400 }
      );
    }

    const created = await createDiscount({
      code,
      name,
      type,
      value: numValue,
      minOrder: minOrder !== undefined ? Number(minOrder) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json({
      success: true,
      message: `Kupon ${created.code} berhasil dibuat!`,
      discount: created,
    });
  } catch (err) {
    console.error("Error creating discount:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
