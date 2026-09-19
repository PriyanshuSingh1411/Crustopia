"use client";
import { useEffect, useState } from "react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    min_order: "",
    expiry: "",
  });

  const loadCoupons = () => {
    setLoading(true);
    fetch("/api/admin/coupons", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCoupons(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const addCoupon = async () => {
    setError("");
    if (!form.code.trim() || !form.value) {
      setError("Coupon code and value are required");
      return;
    }
    if (Number(form.value) <= 0) {
      setError("Value must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to add coupon");
        return;
      }
      setForm({ code: "", type: "percent", value: "", min_order: "", expiry: "" });
      loadCoupons();
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id, status) => {
    await fetch("/api/admin/coupons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: status === "active" ? "inactive" : "active" }),
      credentials: "include",
    });
    loadCoupons();
  };

  const deleteCoupon = async (id) => {
    if (!confirm("Delete this coupon? This can't be undone.")) return;
    await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      credentials: "include",
    });
    loadCoupons();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">🎟️ Coupon Management</h1>
        <p className="text-sm text-slate-500">{coupons.length} coupons configured</p>
      </div>

      {/* ADD COUPON */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Add New Coupon</h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            placeholder="CODE (e.g. SAVE10)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
          />

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
          >
            <option value="percent">Percent (%)</option>
            <option value="fixed">Flat Amount (₹)</option>
          </select>

          <input
            type="number"
            placeholder={form.type === "percent" ? "e.g. 10" : "e.g. 100"}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
          />

          <input
            type="number"
            placeholder="Min order (optional)"
            value={form.min_order}
            onChange={(e) => setForm({ ...form, min_order: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
          />

          <input
            type="date"
            value={form.expiry}
            onChange={(e) => setForm({ ...form, expiry: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <button
          onClick={addCoupon}
          disabled={saving}
          className="mt-4 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-green-700 disabled:opacity-60"
        >
          {saving ? "Adding…" : "+ Add Coupon"}
        </button>
      </section>

      {/* LIST COUPONS */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading coupons…</div>
      ) : coupons.length === 0 ? (
        <div className="py-12 text-center text-slate-400">No coupons yet — add one above.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold tracking-wide text-slate-900">{c.code}</div>
                  <div className="text-sm font-medium text-orange-600">
                    {c.type === "percent" ? `${c.value}% OFF` : `₹${c.value} OFF`}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    c.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-slate-500">
                <p>Min order: ₹{c.min_order || 0}</p>
                <p>Expiry: {c.expiry ? new Date(c.expiry).toLocaleDateString() : "No expiry"}</p>
              </div>

              <div className="mt-auto flex gap-2 pt-2">
                <button
                  onClick={() => toggleStatus(c.id, c.status)}
                  className="flex-1 rounded-lg bg-blue-50 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  {c.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => deleteCoupon(c.id)}
                  className="flex-1 rounded-lg bg-red-50 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
