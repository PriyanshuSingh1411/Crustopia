import Razorpay from "razorpay";
import { NextResponse } from "next/server";

// NOTE: the Razorpay client used to be instantiated at module scope
// (`const razorpay = new Razorpay(...)` at the top of this file). That
// code runs during `next build`'s page-data collection step — not just
// at request time — so if RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET aren't set
// in the build environment, the SDK throws immediately and the entire
// build fails with "key_id or oauthToken is mandatory", even though
// nothing was actually trying to create an order yet. Instantiating it
// inside the handler means it's only created when a real request comes
// in, and a missing key produces a normal 500 response instead of
// breaking the build.
export async function POST(req) {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY CONFIG ERROR: RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not set");
      return NextResponse.json(
        { error: "Online payments are not configured on this server" },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount, // already in paise from the frontend
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error("RAZORPAY CREATE ORDER ERROR:", err.message);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}
