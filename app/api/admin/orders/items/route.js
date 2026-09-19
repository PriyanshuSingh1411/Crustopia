import db from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { orderId } = await req.json();
    const [items] = await db.query(
      `SELECT oi.quantity, oi.price, p.name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId],
    );
    return NextResponse.json(items);
  } catch (err) {
    console.error("ORDER ITEMS ERROR:", err.message);
    return NextResponse.json([], { status: 500 });
  }
}
