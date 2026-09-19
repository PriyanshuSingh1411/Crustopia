import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ message: "Admin OK" });
}
