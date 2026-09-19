"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { clearCart } from "@/lib/cart";

// useSearchParams() requires a Suspense boundary for static prerendering —
// this was silently masked before by a leftover duplicate page.js file
// that happened to be the one Next.js was actually resolving; removing
// that duplicate surfaced the real requirement.
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<SuccessShell orderId={null} />}>
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  useEffect(() => {
    // Belt-and-suspenders: checkout already clears the cart after a
    // successful order, but clear again here in case this page is
    // reached directly.
    clearCart();
  }, []);

  return <SuccessShell orderId={orderId} />;
}

function SuccessShell({ orderId }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Order Confirmed!</h1>

        <p className="mb-6 text-gray-600">
          {orderId
            ? `Thank you for your order #${orderId}. It's being prepared and you'll receive updates as it's on its way.`
            : "Thank you for your order! It's being prepared and you'll receive updates as it's on its way."}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/orders"
            className="w-full rounded-lg bg-black py-3 font-medium text-white transition hover:bg-gray-800"
          >
            Track My Order
          </Link>
          <Link
            href="/menu"
            className="w-full rounded-lg border border-gray-200 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
