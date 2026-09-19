import { NextResponse } from "next/server";

// This route was missing entirely — the Navbar's logout button called
// /api/auth/logout, which 404'd, so the session cookie was never cleared
// and users were never actually logged out.
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
  return response;
}
