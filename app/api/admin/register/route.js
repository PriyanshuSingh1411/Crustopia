import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { getAdminSession, anyAdminExists } from "@/lib/adminAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Creates a new admin account.
//
// SECURITY: this used to be a completely open, unauthenticated endpoint —
// anyone could POST here and mint themselves an admin account. Now:
//   - If no admin exists yet, this is allowed once, to bootstrap the very
//     first admin account for a fresh deployment.
//   - Once at least one admin exists, only an already-authenticated admin
//     may create additional admin accounts.
export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterSeconds } = checkRateLimit(
      `admin-register:${ip}`,
      5,
      15 * 60_000,
    );
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

    const bootstrapAllowed = !(await anyAdminExists());

    if (!bootstrapAllowed) {
      const session = await getAdminSession();
      if (!session) {
        return NextResponse.json(
          { message: "Only an existing admin can create new admin accounts" },
          { status: 401 },
        );
      }
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields required" },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existing.length) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, "admin"],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ADMIN REGISTER ERROR:", err.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
