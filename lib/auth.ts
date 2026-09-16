import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "digitara_admin_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 hari

// Constant-time string comparison untuk mencegah timing attack
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getSecretKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[SECURITY WARNING] ADMIN_SESSION_SECRET tidak diset di environment produksi! Sangat disarankan untuk mengaturnya di pengaturan hosting."
      );
    }
    return "lapakdigitara-default-secure-secret-key-fallback-2026";
  }
  return secret;
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

  const userMatch = timingSafeEqualStr(user, expectedUser);
  const passMatch = timingSafeEqualStr(pass, expectedPass);

  return userMatch && passMatch;
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

    // Validasi signature HMAC dengan timing safe comparison
    const payload = `${prefix}:${timestampStr}`;
    const secret = getSecretKey();
    const expectedSignature = await signMessage(payload, secret);

    return timingSafeEqualStr(signature, expectedSignature);
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
