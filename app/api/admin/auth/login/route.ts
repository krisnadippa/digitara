import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminCredentials,
  createAdminSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

// Sederhana in-memory rate limiter untuk proteksi brute force login
interface AttemptRecord {
  count: number;
  resetAt: number;
}
const loginAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 Menit

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count += 1;
  return true;
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error:
            "Terlalu banyak percobaan login yang gagal. Demi keamanan, silakan tunggu 1 menit.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const isValid = checkAdminCredentials(username.trim(), password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password salah. Silakan coba lagi." },
        { status: 401 }
      );
    }

    // Login sukses: reset penghitung failed attempt
    resetRateLimit(clientIp);

    const token = await createAdminSessionToken();

    const response = NextResponse.json({
      success: true,
      message: "Login admin berhasil.",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat login." },
      { status: 500 }
    );
  }
}
