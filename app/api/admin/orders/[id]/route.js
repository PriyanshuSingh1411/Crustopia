import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function DELETE(req, context) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id: orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    await db.query("DELETE FROM order_items WHERE order_id = ?", [orderId]);
    const [result] = await db.query("DELETE FROM orders WHERE id = ?", [orderId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE ORDER ERROR:", err.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
