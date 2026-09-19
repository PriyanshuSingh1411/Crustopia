import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [rows] = await db.query("SELECT * FROM coupons ORDER BY id DESC");
  return NextResponse.json(rows);
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { code, type, value, min_order, expiry } = await req.json();

  if (!code || !type || value === undefined) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }
  if (!["percent", "fixed"].includes(type)) {
    return NextResponse.json({ message: "Invalid coupon type" }, { status: 400 });
  }

  await db.query(
    `INSERT INTO coupons (code, type, value, min_order, expiry, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [code.toUpperCase(), type, Number(value), Number(min_order) || 0, expiry || null],
  );

  return NextResponse.json({ message: "Coupon added" });
}

export async function PUT(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id, status } = await req.json();
  await db.query("UPDATE coupons SET status=? WHERE id=?", [status, id]);
  return NextResponse.json({ message: "Updated" });
}

export async function DELETE(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await req.json();
  await db.query("DELETE FROM coupons WHERE id=?", [id]);
  return NextResponse.json({ message: "Deleted" });
}
