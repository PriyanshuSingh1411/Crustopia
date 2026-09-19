import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getSettings, saveSettings } from "@/lib/settings";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const settings = await getSettings();
  return NextResponse.json({ success: true, settings });
}

export async function PUT(req) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await req.json();
    await saveSettings(body);
    const settings = await getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("SETTINGS UPDATE ERROR:", err.message);
    return NextResponse.json(
      { success: false, message: "Failed to save settings" },
      { status: 500 },
    );
  }
}
