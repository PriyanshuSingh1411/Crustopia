"use client";
import { useState } from "react";

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    is_featured: false,
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("image", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const result = await res.json();
      if (!res.ok) {
        setError(result.message || "Image upload failed");
        return;
      }
      setForm((prev) => ({ ...prev, image: result.imageUrl }));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.image) {
      setError("Please upload a product image first");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save product");
        return;
      }
      window.location.href = "/admin/products";
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <h1 className="mb-6 text-2xl font-bold text-slate-900">🍕 Add New Pizza</h1>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Field label="Product Name">
            <input
              required
              placeholder="Margherita"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              placeholder="Fresh mozzarella, basil, tomato sauce…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₹)">
              <input
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="299"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Category">
              <input
                placeholder="Classic / Veg / Meat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input"
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              className="h-4 w-4 accent-orange-500"
            />
            Feature this item on the homepage
          </label>

          <Field label="Product Image">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => uploadImage(e.target.files[0])}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-700 hover:file:bg-orange-100"
            />
          </Field>

          {uploading && <p className="text-sm text-slate-500">Uploading image…</p>}

          {form.image && (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <img src={form.image} alt="Preview" className="block w-full" />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || uploading}
          className="mt-6 w-full rounded-xl bg-green-600 py-3.5 font-semibold text-white shadow-md transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save Product"}
        </button>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #f97316;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
