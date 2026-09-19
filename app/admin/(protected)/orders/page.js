"use client";
import { useEffect, useMemo, useState } from "react";

const STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

const STATUS_STYLE = {
  Delivered: "bg-green-100 text-green-700",
  "Out for Delivery": "bg-blue-100 text-blue-700",
  Preparing: "bg-amber-100 text-amber-700",
  Placed: "bg-slate-100 text-slate-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [q, setQ] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      if (!res.ok) throw new Error();
      setOrders(await res.json());
    } catch {
      window.location.href = "/auth/admin/login";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const changeStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, status }),
    });
  };

  const viewDetails = async (orderId) => {
    setActiveOrder(orderId);
    setShowModal(true);
    setItems([]);
    const res = await fetch("/api/admin/orders/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId }),
    });
    setItems(await res.json());
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently delete this order? This can't be undone.")) return;
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      alert("Failed to delete order");
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === "All" || o.status === statusFilter;
      const matchesQuery =
        !q.trim() ||
        String(o.id).includes(q.trim()) ||
        o.delivery_address?.name?.toLowerCase().includes(q.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [orders, statusFilter, q]);

  const activeOrderData = orders.find((o) => o.id === activeOrder);

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Loading orders…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
        <p className="text-sm text-slate-500">
          {orders.length} total orders — view, update, and track customer orders
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === s
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order # or customer name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-400 shadow-sm">
          No orders match this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Order #{order.id}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {order.delivery_address?.name || "—"}
                  </p>
                  <p className="mt-1 font-bold text-slate-900">₹{order.total}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    STATUS_STYLE[order.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={order.status}
                  onChange={(e) => changeStatus(order.id, e.target.value)}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-sm outline-none focus:border-orange-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                <button
                  onClick={() => viewDetails(order.id)}
                  className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View
                </button>

                <button
                  onClick={() => handleDelete(order.id)}
                  className="rounded-lg bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Order #{activeOrder}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {activeOrderData?.delivery_address && (
              <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{activeOrderData.delivery_address.name}</p>
                <p>{activeOrderData.delivery_address.phone}</p>
                <p>
                  {activeOrderData.delivery_address.street}, {activeOrderData.delivery_address.city},{" "}
                  {activeOrderData.delivery_address.state} - {activeOrderData.delivery_address.pincode}
                </p>
                {activeOrderData.delivery_address.landmark && (
                  <p>Landmark: {activeOrderData.delivery_address.landmark}</p>
                )}
              </div>
            )}

            {items.length === 0 ? (
              <p className="py-4 text-sm text-slate-400">Loading items…</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-900">
                      ₹{item.quantity * item.price}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
