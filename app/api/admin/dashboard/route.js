import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const [[usersCount]] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE role='user'",
    );
    const [[ordersCount]] = await db.query("SELECT COUNT(*) as total FROM orders");
    const [[productsCount]] = await db.query("SELECT COUNT(*) as total FROM products");
    const [[revenue]] = await db.query(
      "SELECT SUM(total) as total FROM orders WHERE status='Delivered'",
    );

    const [users] = await db.query(
      "SELECT id, name, email, is_blocked FROM users WHERE role='user' ORDER BY id DESC LIMIT 50",
    );
    const [orders] = await db.query(
      "SELECT id, user_id, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 50",
    );
    const [products] = await db.query("SELECT id, name, price FROM products");
    const [deliveredOrders] = await db.query(
      "SELECT id, total, created_at FROM orders WHERE status='Delivered'",
    );

    return NextResponse.json({
      summary: {
        totalUsers: usersCount.total,
        totalOrders: ordersCount.total,
        totalProducts: productsCount.total,
        totalRevenue: revenue.total || 0,
      },
      details: { users, orders, products, revenue: deliveredOrders },
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
