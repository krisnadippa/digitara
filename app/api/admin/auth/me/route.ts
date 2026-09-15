import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/auth";

export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: process.env.ADMIN_USERNAME || "admin",
  });
}
