import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import db from "./db";

/**
 * Verify the admin_token cookie and return the admin's decoded token
 * payload, or null if missing/invalid/expired/not-an-admin.
 * This only trusts the JWT signature + role claim — callers that need
 * fresh DB state (e.g. to check is_blocked) should look the user up.
 */
export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return null;

    return decoded; // { userId, role, iat, exp }
  } catch {
    return null;
  }
}

/**
 * Use at the top of any admin API route:
 *
 *   const admin = await requireAdmin();
 *   if (admin instanceof NextResponse) return admin;
 *
 * Returns the decoded session on success, or a ready-to-return 401/403
 * NextResponse on failure — collapses the ~10 copies of this same
 * cookie/jwt/role check that used to live in every admin route.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return session;
}

/** True if at least one admin account already exists. */
export async function anyAdminExists() {
  const [rows] = await db.query(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
  );
  return rows.length > 0;
}
