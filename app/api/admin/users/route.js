import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// List users. type=customers (default) | admins
export async function GET(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "admins" ? "admin" : "user";
  const q = searchParams.get("q")?.trim();

  let sql = "SELECT id, name, email, role, is_blocked, created_at FROM users WHERE role = ?";
  const params = [type];

  if (q) {
    sql += " AND (name ILIKE ? OR email ILIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY created_at DESC LIMIT 200";

  const [rows] = await db.query(sql, params);
  return NextResponse.json({ success: true, users: rows });
}

// Update a user: block/unblock a customer, or change an admin's role.
export async function PATCH(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id, is_blocked, role } = await req.json();
    if (!id) {
      return NextResponse.json({ message: "Missing user id" }, { status: 400 });
    }

    if (Number(id) === Number(admin.userId)) {
      return NextResponse.json(
        { message: "You can't change your own account this way" },
        { status: 400 },
      );
    }

    if (typeof is_blocked === "boolean") {
      await db.query("UPDATE users SET is_blocked = ? WHERE id = ?", [is_blocked, id]);
    }

    if (role && ["user", "admin"].includes(role)) {
      await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("USER UPDATE ERROR:", err.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
