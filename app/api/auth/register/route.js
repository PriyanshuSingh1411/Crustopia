import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterSeconds } = checkRateLimit(`register:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
      [name, email, hashedPassword],
    );

    return NextResponse.json({ message: "Registration successful" }, { status: 201 });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
