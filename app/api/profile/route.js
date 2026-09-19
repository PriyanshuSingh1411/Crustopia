import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromToken();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ success: true, user });
}

export async function PATCH(req) {
  const user = await getUserFromToken();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, phone, address } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    await db.query("UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?", [
      name.trim(),
      phone || null,
      address || null,
      user.id,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
