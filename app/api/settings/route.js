import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// Public — powers the homepage, navbar, footer, checkout (delivery fee /
// tax / min order) with whatever the admin has configured, instead of
// those values being hardcoded in components.
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ success: true, settings });
}
