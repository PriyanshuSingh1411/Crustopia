import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterSeconds } = checkRateLimit(`admin-login:${ip}`, 8, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND role = 'admin'",
      [email],
    );

    if (!rows.length) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      { userId: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
