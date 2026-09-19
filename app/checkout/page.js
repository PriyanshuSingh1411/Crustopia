"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCart } from "@/lib/cart";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);

    fetch("/api/coupons")
      .then((res) => res.json())
      .then((data) => setCoupons(data))
      .catch(() => {});

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {});

    // Pre-fill delivery details from the user's saved profile, if any.
    fetch("/api/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAddress((prev) => ({
            ...prev,
            name: prev.name || data.user.name || "",
            phone: prev.phone || data.user.phone || "",
            street: prev.street || data.user.address || "",
          }));
        }
      })
      .catch(() => {});

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const currency = settings.currency_symbol || "₹";
  const deliveryFee = Number(settings.delivery_fee || 0);
  const freeDeliveryAbove = Number(settings.free_delivery_above || 0);
  const minOrder = Number(settings.min_order_amount || 0);
  const taxPercent = Number(settings.tax_percent || 0);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round((subtotal * taxPercent) / 100);
  const effectiveDeliveryFee =
    freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove ? 0 : deliveryFee;
  const total = Math.max(subtotal - discount, 0) + tax + effectiveDeliveryFee;

  const applyCoupon = async () => {
    if (appliedCoupon) return;
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }
    setError("");

    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.toUpperCase(), total: subtotal }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid coupon");
        return;
      }
      setAppliedCoupon(couponCode.toUpperCase());
      setDiscount(data.discount);
    } catch {
      setError("Failed to apply coupon");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
  };

  const validateAddress = () => {
    if (!address.name.trim()) return "Please enter your name";
    if (!address.phone.trim() || address.phone.length < 10) return "Please enter a valid phone number";
    if (!address.street.trim()) return "Please enter your street address";
    if (!address.city.trim()) return "Please enter your city";
    if (!address.state.trim()) return "Please enter your state";
    if (!address.pincode.trim() || address.pincode.length < 6) return "Please enter a valid pincode";
    return null;
  };

  const finalizeOrder = async (payload) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      // Log the raw response so the real reason is visible in DevTools
      // even if the on-page message ends up generic for some reason.
      console.error("ORDER SAVE FAILED:", res.status, data);
      setError(data.message || "Failed to place order");
      return false;
    }

    clearCart();
    router.push(`/order-success?orderId=${data.orderId}`);
    return true;
  };

  const handleRazorpayPayment = async () => {
    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(total * 100) }),
      });
      const order = await res.json();

      if (!window.Razorpay) {
        setError("Payment SDK not loaded. Please refresh the page.");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: settings.site_name || "Crustopia",
        description: `Order for ${currency}${total}`,
        order_id: order.id,
        handler: async function (response) {
          // NOTE: this used to unconditionally overwrite whatever specific
          // error finalizeOrder() already set with a generic message,
          // which is why the real reason never showed up on screen.
          // finalizeOrder() already sets the actual server error — leave
          // it alone here.
          await finalizeOrder({
            cart,
            coupon: appliedCoupon,
            payment_method: "ONLINE",
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            delivery_address: address,
          });
        },
        modal: {
          ondismiss: function () {
            setError("Payment cancelled");
          },
        },
        theme: { color: "#ea580c" },
      };

      new window.Razorpay(options).open();
    } catch {
      setError("Something went wrong while starting payment.");
    }
  };

  const placeOrder = async () => {
    setError("");
    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }
    if (minOrder > 0 && subtotal < minOrder) {
      setError(`Minimum order amount is ${currency}${minOrder}`);
      return;
    }
    const addressError = validateAddress();
    if (addressError) {
      setError(addressError);
      return;
    }

    if (paymentMethod === "ONLINE") {
      await handleRazorpayPayment();
      return;
    }

    setPlacing(true);
    await finalizeOrder({
      cart,
      coupon: appliedCoupon,
      payment_method: "COD",
      delivery_address: address,
    });
    setPlacing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">🛒 Checkout</h1>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* LEFT: items + address + payment */}
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">📦 Order Items</h3>
              {cart.length === 0 ? (
                <p className="text-slate-500">Your cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.customKey || item.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <img
                        src={item.image || "/pizza-bg.jpg"}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-medium text-slate-900">{item.name}</h4>
                        <p className="truncate text-sm text-slate-500">
                          {item.description || "Delicious pizza"}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-sm">
                          <span className="text-slate-500">Qty: {item.qty}</span>
                          <span className="font-semibold text-slate-900">
                            {currency}
                            {item.price * item.qty}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">🚚 Delivery Address</h3>
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                <AddressField label="Full Name *" value={address.name} onChange={(v) => setAddress({ ...address, name: v })} placeholder="John Doe" />
                <AddressField label="Phone Number *" value={address.phone} onChange={(v) => setAddress({ ...address, phone: v })} placeholder="9876543210" maxLength={10} />
                <AddressField className="sm:col-span-2" label="Street Address *" value={address.street} onChange={(v) => setAddress({ ...address, street: v })} placeholder="123, Main Road, Area" />
                <AddressField label="City *" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} placeholder="Mumbai" />
                <AddressField label="State *" value={address.state} onChange={(v) => setAddress({ ...address, state: v })} placeholder="Maharashtra" />
                <AddressField label="Pincode *" value={address.pincode} onChange={(v) => setAddress({ ...address, pincode: v })} placeholder="400001" maxLength={6} />
                <AddressField label="Landmark (Optional)" value={address.landmark} onChange={(v) => setAddress({ ...address, landmark: v })} placeholder="Near School" />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">💳 Payment Method</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { value: "COD", icon: "💵", title: "Cash on Delivery", desc: "Pay when you receive" },
                  { value: "ONLINE", icon: "💳", title: "Online Payment", desc: "Pay via Razorpay" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${
                      paymentMethod === opt.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="accent-orange-500"
                    />
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <div className="font-medium text-slate-900">{opt.title}</div>
                      <div className="text-sm text-slate-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: summary */}
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">💰 Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{currency}{subtotal}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({appliedCoupon})</span>
                    <span>-{currency}{discount}</span>
                  </div>
                )}
                {taxPercent > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({taxPercent}%)</span>
                    <span>{currency}{tax}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span>{effectiveDeliveryFee === 0 ? "FREE" : `${currency}${effectiveDeliveryFee}`}</span>
                </div>
                <div className="border-t border-slate-200 pt-2">
                  <div className="flex justify-between text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span>{currency}{total}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h4 className="mb-3 font-semibold text-slate-900">🎟️ Have a Coupon?</h4>
              {!appliedCoupon ? (
                <>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={applyCoupon}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Apply
                    </button>
                  </div>
                  {coupons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {coupons.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => setCouponCode(c.code)}
                          className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100"
                        >
                          {c.code} — {c.type === "percent" ? `${c.value}% OFF` : `${currency}${c.value} OFF`}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  <span>✓ {appliedCoupon} Applied</span>
                  <button onClick={removeCoupon} className="font-semibold underline">
                    Remove
                  </button>
                </div>
              )}
            </section>

            <button
              onClick={placeOrder}
              disabled={cart.length === 0 || placing}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-4 font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placing
                ? "Placing Order…"
                : paymentMethod === "COD"
                  ? "🛵 Place Order (COD)"
                  : "💳 Pay & Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressField({ label, value, onChange, placeholder, maxLength, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
      />
    </div>
  );
}