import { NextResponse } from "next/server";
import db from "@/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function PUT(req, { params }) {
  try {
    const orderId = params.id;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    const userId = user.userId;

    const [rows] = await db.query(
      "SELECT status FROM orders WHERE id = ? AND user_id = ?",
      [orderId, userId],
    );

    if (!rows.length) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const currentStatus = rows[0].status;

    if (
      ["Delivered", "Out for Delivery", "Cancelled"].includes(currentStatus)
    ) {
      return NextResponse.json(
        { message: "Order cannot be cancelled now" },
        { status: 400 },
      );
    }

    await db.query(
      "UPDATE orders SET status = ? WHERE id = ? AND user_id = ?",
      ["Cancelled", orderId, userId],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
