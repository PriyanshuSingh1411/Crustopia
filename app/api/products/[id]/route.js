import { NextResponse } from "next/server";
import db from "@/lib/db";

// Public, read-only product lookup for the menu/product-detail pages.
// NOTE: mutation of products is handled exclusively by the authenticated
// /api/admin/products/[id] route — this route used to also expose an
// unauthenticated PUT handler that let anyone edit any product; it has
// been removed.
export async function GET(req, { params }) {
  const { id } = await params;

  const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);

  if (!rows.length) {
    return NextResponse.json(
      { success: false, error: "Product not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    product: rows[0],
  });
}
