import { NextResponse } from "next/server";

// NOTE: this only checks that a token cookie is *present* — it can't
// verify the JWT signature (the `jsonwebtoken` package needs Node APIs
// that aren't available in the Edge middleware runtime). Every protected
// API route and the admin layout independently verify the token's
// signature and role server-side, so this middleware is a fast first
// gate (redirect obviously-unauthenticated visits) rather than the only
// line of defense.
export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register")) {
    return NextResponse.next();
  }

  // Customer-facing protected routes
  const userProtectedRoutes = ["/menu", "/cart", "/checkout", "/orders", "/profile"];
  const token = req.cookies.get("token")?.value;

  if (userProtectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Admin dashboard routes — previously NOT covered by this middleware at
  // all, relying solely on a server layout whose redirect logic had been
  // commented out. The admin_token cookie presence is checked here; full
  // verification happens in app/admin/(protected)/layout.js and in every
  // /api/admin/* route via requireAdmin().
  const isAdminDashboard =
    pathname.startsWith("/admin") &&
    pathname !== "/admin/register" &&
    !pathname.startsWith("/auth/admin");
  const adminToken = req.cookies.get("admin_token")?.value;

  if (isAdminDashboard && !adminToken) {
    return NextResponse.redirect(new URL("/auth/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/menu/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
