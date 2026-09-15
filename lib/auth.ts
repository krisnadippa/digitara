import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "digitara_admin_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 hari

function getSecretKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    "lapakdigitara-default-secure-secret-key-fallback-2026"
  );
}

// Helper: HMAC SHA-256 menggunakan Web Crypto API (kompatibel Node.js & Edge Runtime)
async function signMessage(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function checkAdminCredentials(user: string, pass: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "digitara2026!";
  return user === expectedUser && pass === expectedPass;
}

export async function createAdminSessionToken(): Promise<string> {
  const now = Date.now();
  const payload = `admin:${now}`;
  const secret = getSecretKey();
  const signature = await signMessage(payload, secret);
  return `${payload}:${signature}`;
}

export async function verifyAdminSessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return false;
    const [prefix, timestampStr, signature] = parts;
    if (prefix !== "admin") return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Periksa masa berlaku sesi (7 hari)
    const isExpired = Date.now() - timestamp > SESSION_MAX_AGE_SECONDS * 1000;
    if (isExpired) return false;

    // Validasi signature HMAC
    const payload = `${prefix}:${timestampStr}`;
    const secret = getSecretKey();
    const expectedSignature = await signMessage(payload, secret);

    return signature === expectedSignature;
  } catch (err) {
    console.error("Error verifying admin token:", err);
    return false;
  }
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(sessionCookie);
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
