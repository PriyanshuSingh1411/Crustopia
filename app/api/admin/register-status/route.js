import { NextResponse } from "next/server";
import { anyAdminExists, getAdminSession } from "@/lib/adminAuth";

// Public, minimal-information endpoint the bootstrap register page uses
// to decide what to show — never leaks who the admins are, just whether
// self-service admin creation is still open.
export async function GET() {
  const bootstrapAllowed = !(await anyAdminExists());
  const isLoggedInAdmin = !!(await getAdminSession());
  return NextResponse.json({ bootstrapAllowed, isLoggedInAdmin });
}
