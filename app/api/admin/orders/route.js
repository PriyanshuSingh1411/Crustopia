import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const [orders] = await db.query(
      "SELECT * FROM orders ORDER BY created_at DESC",
    );
    return NextResponse.json(orders);
  } catch (err) {
    console.error("ADMIN ORDERS GET ERROR:", err.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id, status } = await req.json();

    const allowedStatuses = [
      "Placed",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ORDER STATUS UPDATE ERROR:", err.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
