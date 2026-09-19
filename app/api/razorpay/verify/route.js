import { NextResponse } from "next/server";
import crypto from "crypto";

// NOTE: this endpoint is kept for immediate UI feedback right after the
// Razorpay checkout popup closes, but it is NOT the source of truth for
// whether an order gets recorded as paid — /api/orders re-verifies the
// signature itself server-side before writing anything to the database,
// so a forged "success" response here can no longer create a free order.
export async function POST(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const valid =
      expected.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

    return NextResponse.json({ success: valid });
  } catch (error) {
    console.error("Razorpay verification error:", error.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
