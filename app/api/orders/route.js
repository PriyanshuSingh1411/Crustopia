import { NextResponse } from "next/server";
import db from "@/lib/db";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { cookies } from "next/headers";

/* ===============================
   GET USER'S OWN ORDERS
================================ */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json([], { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!user.userId) {
      return NextResponse.json([], { status: 401 });
    }

    const [orders] = await db.query(
      `SELECT id, total, discount, coupon_code, payment_method, status,
              payment_status, delivery_address, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user.userId],
    );

    if (!orders.length) return NextResponse.json([]);

    const orderIds = orders.map((o) => o.id);
    const [items] = await db.query(
      `SELECT oi.order_id, oi.quantity, oi.price, p.name, p.description, p.image
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (?)`,
      [orderIds],
    );

    const result = orders.map((order) => ({
      ...order,
      items: items.filter((i) => i.order_id === order.id),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET ORDERS ERROR:", err.message);
    return NextResponse.json([], { status: 500 });
  }
}

/* ===============================
   PLACE ORDER
   SECURITY: previously trusted the client for item price, subtotal,
   discount and total (a shopper could edit localStorage/devtools and
   check out for ₹0), and never verified Razorpay payments server-side
   before recording an order as placed. This version:
     - re-prices every cart line from the products table
     - re-validates any coupon and recomputes the discount server-side
     - re-verifies the Razorpay signature itself for online payments,
       instead of trusting a prior client-reported "verified" flag
     - persists delivery address / payment method / coupon, which the
       checkout form collected but the old route silently dropped
================================ */
export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!user.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid user" },
        { status: 401 },
      );
    }
    const userId = user.userId;

    const body = await req.json();
    const {
      cart,
      coupon,
      payment_method,
      delivery_address,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!Array.isArray(cart) || cart.length === 0) {
      console.error("ORDER REJECTED: empty/invalid cart", { cart });
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 },
      );
    }
    if (!["COD", "ONLINE"].includes(payment_method)) {
      console.error("ORDER REJECTED: invalid payment_method", { payment_method });
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 },
      );
    }

    // --- Re-price every line item from the database (never trust client price) ---
    const productIds = [...new Set(cart.map((i) => i.id))];
    const [products] = await db.query(
      "SELECT id, price, is_available FROM products WHERE id IN (?)",
      [productIds],
    );
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of cart) {
      const product = productMap.get(item.id);
      if (!product) {
        console.error("ORDER REJECTED: product not found", { itemId: item.id, productIds });
        return NextResponse.json(
          { success: false, message: "One or more items are no longer available" },
          { status: 400 },
        );
      }
      if (product.is_available === false) {
        console.error("ORDER REJECTED: product unavailable", { itemId: item.id });
        return NextResponse.json(
          { success: false, message: "One or more items are currently unavailable" },
          { status: 400 },
        );
      }
    }

    const subtotal = cart.reduce((sum, item) => {
      const product = productMap.get(item.id);
      const qty = Math.max(1, Number(item.qty) || 1);
      return sum + Number(product.price) * qty;
    }, 0);

    // --- Re-validate coupon and recompute discount server-side ---
    let discount = 0;
    let couponCode = null;

    if (coupon) {
      const [couponRows] = await db.query(
        `SELECT * FROM coupons WHERE code = ? AND status = 'active'
         AND (expiry IS NULL OR expiry >= CURRENT_DATE)`,
        [String(coupon).toUpperCase()],
      );

      if (couponRows.length && subtotal >= Number(couponRows[0].min_order || 0)) {
        const c = couponRows[0];
        discount =
          c.type === "percent"
            ? Math.floor((subtotal * Number(c.value)) / 100)
            : Number(c.value);
        couponCode = c.code;
      }
    }

    const total = Math.max(subtotal - discount, 0);

    // --- Verify online payments server-side; never trust the client ---
    let paymentStatus = "pending";

    if (payment_method === "ONLINE") {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error("ORDER REJECTED: missing razorpay fields", {
          hasOrderId: !!razorpay_order_id,
          hasPaymentId: !!razorpay_payment_id,
          hasSignature: !!razorpay_signature,
        });
        return NextResponse.json(
          { success: false, message: "Missing payment verification details" },
          { status: 400 },
        );
      }

      if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error("ORDER REJECTED: RAZORPAY_KEY_SECRET not set on server");
        return NextResponse.json(
          { success: false, message: "Online payments are not configured on this server" },
          { status: 500 },
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      const valid =
        expectedSignature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(razorpay_signature),
        );

      if (!valid) {
        console.error("ORDER REJECTED: signature mismatch", {
          expectedLength: expectedSignature.length,
          receivedLength: razorpay_signature.length,
        });
        return NextResponse.json(
          { success: false, message: "Payment verification failed" },
          { status: 400 },
        );
      }
      paymentStatus = "paid";
    }

    /* CREATE ORDER */
    const [orderRes] = await db.query(
      `INSERT INTO orders
         (user_id, total, discount, coupon_code, payment_method, status,
          payment_status, delivery_address, razorpay_order_id, razorpay_payment_id)
       VALUES (?, ?, ?, ?, ?, 'Placed', ?, ?, ?, ?)`,
      [
        userId,
        total,
        discount,
        couponCode,
        payment_method,
        paymentStatus,
        delivery_address ? JSON.stringify(delivery_address) : null,
        razorpay_order_id || null,
        razorpay_payment_id || null,
      ],
    );

    const orderId = orderRes.insertId;

    const values = cart.map((item) => {
      const product = productMap.get(item.id);
      const qty = Math.max(1, Number(item.qty) || 1);
      return [orderId, item.id, qty, Number(product.price)];
    });

    await db.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [values],
    );

    return NextResponse.json({ success: true, orderId, total, discount });
  } catch (err) {
    console.error("PLACE ORDER ERROR:", err.message);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}