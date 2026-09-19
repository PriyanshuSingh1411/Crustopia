import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { code, total } = await req.json();

  const [rows] = await db.query(
    "SELECT * FROM coupons WHERE code=? AND status='active' AND (expiry IS NULL OR expiry >= CURDATE())",
    [code]
  );

  if (rows.length === 0) {
    return NextResponse.json({ message: "Invalid coupon" }, { status: 400 });
  }

  const coupon = rows[0];

  if (total < coupon.min_order) {
    return NextResponse.json(
      { message: `Minimum order ₹${coupon.min_order}` },
      { status: 400 }
    );
  }

  let discount = 0;
  if (coupon.type === "percent") {
    discount = Math.floor((total * coupon.value) / 100);
  } else {
    discount = coupon.value;
  }

  return NextResponse.json({ discount });
}
