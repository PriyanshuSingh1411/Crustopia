import db from "@/lib/db";

import { NextResponse } from "next/server";

export async function GET() {
  const [rows] = await db.query(
    "SELECT code, type, value, min_order FROM coupons WHERE status='active' AND (expiry IS NULL OR expiry >= CURDATE())"
  );

  return NextResponse.json(rows);
}
