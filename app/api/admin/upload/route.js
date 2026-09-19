import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { saveUploadedImage } from "@/lib/upload";

export async function POST(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const formData = await req.formData();
    const file = formData.get("image");

    const imageUrl = await saveUploadedImage(file);
    return NextResponse.json({ imageUrl });
  } catch (err) {
    return NextResponse.json({ message: err.message || "Upload failed" }, { status: 400 });
  }
}
