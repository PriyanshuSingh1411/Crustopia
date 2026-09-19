"use client";
import { useEffect, useMemo, useState } from "react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const loadProducts = () => {
    setLoading(true);
    fetch("/api/admin/products", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product? This can't be undone.")) return;
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete product");
      return;
    }
    loadProducts();
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return products;
    const term = q.toLowerCase();
    return products.filter(
      (p) => p.name?.toLowerCase().includes(term) || p.category?.toLowerCase().includes(term),
    );
  }, [products, q]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🍕 Manage Products</h1>
          <p className="text-sm text-slate-500">{products.length} items on your menu</p>
        </div>
        <a
          href="/admin/products/add"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600"
        >
          ➕ Add New Pizza
        </a>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products…"
        className="mb-6 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
      />

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-video w-full bg-slate-100">
                {p.image && (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <span className="whitespace-nowrap font-bold text-orange-600">
                    ₹{p.price}
                  </span>
                </div>
                {p.description && (
                  <p className="line-clamp-2 text-sm text-slate-500">{p.description}</p>
                )}
                <div className="mt-auto flex gap-2 pt-2">
                  <a
                    href={`/admin/products/edit/${p.id}`}
                    className="flex-1 rounded-lg bg-blue-50 py-2 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="flex-1 rounded-lg bg-red-50 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}