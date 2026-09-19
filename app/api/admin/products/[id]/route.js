import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { saveUploadedImage } from "@/lib/upload";

/* GET SINGLE PRODUCT (admin) */
export async function GET(req, context) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await context.params;
  const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);

  if (!rows.length) {
    return NextResponse.json(
      { success: false, error: "Product not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, product: rows[0] });
}

/* UPDATE PRODUCT (with optional new image) */
export async function PUT(req, context) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await context.params;
    const formData = await req.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const price = formData.get("price");
    const category = formData.get("category");
    const image = formData.get("image"); // File | null
    const is_featured = formData.get("is_featured") === "true";
    const is_available = formData.get("is_available") !== "false";

    if (!name || !price) {
      return NextResponse.json(
        { success: false, error: "Name and price required" },
        { status: 400 },
      );
    }
    if (Number(price) <= 0) {
      return NextResponse.json(
        { success: false, error: "Price must be greater than 0" },
        { status: 400 },
      );
    }

    let imageUrl = null;
    if (image && typeof image === "object" && image.size > 0) {
      imageUrl = await saveUploadedImage(image);
    }

    if (imageUrl) {
      await db.query(
        `UPDATE products
         SET name=?, description=?, price=?, category=?, image=?, is_featured=?, is_available=?
         WHERE id=?`,
        [name, description, price, category, imageUrl, is_featured, is_available, id],
      );
    } else {
      await db.query(
        `UPDATE products
         SET name=?, description=?, price=?, category=?, is_featured=?, is_available=?
         WHERE id=?`,
        [name, description, price, category, is_featured, is_available, id],
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}

/* DELETE PRODUCT */
export async function DELETE(req, context) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await context.params;
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    // Postgres error code 23503 = foreign key violation. Here that means
    // this product has existing orders referencing it — deleting it would
    // corrupt those orders' line items, so the database correctly refused.
    // Give the admin a clear next step instead of a raw DB error.
    if (error.code === "23503") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This product can't be deleted because it's part of an existing order. Mark it as unavailable instead to hide it from the menu while keeping order history intact.",
        },
        { status: 409 },
      );
    }

    console.error("DELETE PRODUCT ERROR:", error.message);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}