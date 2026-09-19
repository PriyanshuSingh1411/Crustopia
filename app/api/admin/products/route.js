import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

// Admin listing — unlike the public /api/products, this includes
// unavailable/hidden items too, so an admin can find and re-enable them.
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [rows] = await db.query(
    `SELECT id, name, description, price, image, category, is_featured, is_available
     FROM products
     ORDER BY display_order ASC, id DESC`,
  );
  return NextResponse.json({ success: true, products: rows });
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await req.json();
    const { name, description, price, category, image, is_featured } = body;

    if (!name || !price || !image) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (Number(price) <= 0) {
      return NextResponse.json(
        { success: false, error: "Price must be greater than 0" },
        { status: 400 },
      );
    }

    await db.query(
      `INSERT INTO products (name, description, price, category, image, is_featured)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, Number(price), category || null, image, !!is_featured],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err.message);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
