import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic"; // disable caching — admin edits should show immediately

export async function GET() {
  const [rows] = await db.query(
    `SELECT id, name, description, price, image, category, is_featured, is_available
     FROM products
     WHERE is_available = true
     ORDER BY display_order ASC, id DESC`,
  );

  return NextResponse.json({
    success: true,
    products: rows,
  });
}
