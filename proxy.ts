import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, SESSION_COOKIE_NAME } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hanya proses rute di bawah /admin
  if (pathname.startsWith("/admin")) {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const isAuthenticated = await verifyAdminSessionToken(sessionCookie);

    // Jika sedang di halaman login /admin/login
    if (pathname === "/admin/login") {
      if (isAuthenticated) {
        // Sudah login, langsung lempar ke /admin dashboard
        const dashboardUrl = new URL("/admin", req.url);
        return NextResponse.redirect(dashboardUrl);
      }
      return NextResponse.next();
    }

    // Jika mengakses halaman admin selain login dan belum login
    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
