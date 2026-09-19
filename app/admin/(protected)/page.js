"use client";
import { useEffect, useState } from "react";

const FALLBACK_DATA = {
  summary: { totalUsers: 0, totalOrders: 0, totalProducts: 0, totalRevenue: 0 },
  details: { users: [], orders: [], products: [], revenue: [] },
};

export default function AdminHome() {
  const [data, setData] = useState(null);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    fetch("/api/admin/dashboard", { credentials: "include" })
      .then((res) => res.json())
      .then((res) => {
        if (res.message) {
          setErrored(true);
          setData(FALLBACK_DATA);
        } else {
          setData(res);
        }
      })
      .catch(() => {
        setErrored(true);
        setData(FALLBACK_DATA);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Unable to load dashboard data.
      </div>
    );
  }

  const { summary, details } = data;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-sm text-slate-500">Monitor your platform performance</p>
      </div>

      {errored && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Couldn&apos;t load live data — showing empty placeholders instead.
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          icon="👤"
          title="Users"
          value={summary.totalUsers}
          active={active === "users"}
          onClick={() => setActive(active === "users" ? null : "users")}
        />
        <Card
          icon="📦"
          title="Orders"
          value={summary.totalOrders}
          active={active === "orders"}
          onClick={() => setActive(active === "orders" ? null : "orders")}
        />
        <Card
          icon="🍕"
          title="Products"
          value={summary.totalProducts}
          active={active === "products"}
          onClick={() => setActive(active === "products" ? null : "products")}
        />
        <Card
          icon="💰"
          title="Revenue"
          value={`₹${summary.totalRevenue}`}
          active={active === "revenue"}
          onClick={() => setActive(active === "revenue" ? null : "revenue")}
        />
      </div>

      {/* DETAILS */}
      <div className="mt-6">
        {active === "users" && (
          <Table
            title="👤 Users List"
            headers={["ID", "Name", "Email"]}
            rows={details.users.map((u) => [u.id, u.name, u.email])}
          />
        )}

        {active === "orders" && (
          <Table
            title="📦 Orders List"
            headers={["ID", "User ID", "Total", "Status", "Date"]}
            rows={details.orders.map((o) => [
              o.id,
              o.user_id,
              `₹${o.total}`,
              o.status,
              new Date(o.created_at).toLocaleString(),
            ])}
          />
        )}

        {active === "products" && (
          <Table
            title="🍕 Products List"
            headers={["ID", "Name", "Price"]}
            rows={details.products.map((p) => [p.id, p.name, `₹${p.price}`])}
          />
        )}

        {active === "revenue" && (
          <Table
            title="💰 Revenue Records"
            headers={["Order ID", "Amount"]}
            rows={details.revenue.map((r) => [r.id, `₹${r.total}`])}
          />
        )}

        {!active && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-10 text-center text-slate-400">
            Click on a card above to view detailed data.
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Card({ icon, title, value, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-3 rounded-2xl border p-5 text-left shadow-sm transition ${
        active
          ? "border-orange-400 bg-orange-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="text-xl">{icon}</span>
        <span>{title}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </button>
  );
}

function Table({ title, headers, rows }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-4 font-semibold text-slate-900">{title}</h3>

      {rows.length === 0 ? (
        <div className="py-8 text-center text-slate-400">No records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                {headers.map((h, i) => (
                  <th key={i} className="whitespace-nowrap px-3 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  {row.map((cell, j) => (
                    <td key={j} className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
