import jwt from "jsonwebtoken";
import db from "./db";
import { cookies } from "next/headers";

// Get the logged-in customer from their session cookie.
// NOTE: this was previously unused dead code, and also broken — it called
// cookies() synchronously, but this Next.js version returns a Promise that
// must be awaited. Now used by /api/profile.
export async function getUserFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.query(
      "SELECT id, name, email, phone, address, is_blocked FROM users WHERE id = ?",
      [decoded.userId],
    );

    return rows[0] || null;
  } catch {
    return null;
  }
}
