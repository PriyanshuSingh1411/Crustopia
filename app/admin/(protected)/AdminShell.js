"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "🍕" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/coupons", label: "Coupons", icon: "🎟️" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
          🍕 Crustopia Admin
        </span>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-xl"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? "block" : "hidden"
        } w-full border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6 text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:border-b-0 lg:px-5`}
      >
        <div className="mb-8 hidden items-center gap-2 text-xl font-bold text-orange-400 lg:flex">
          🍕 <span>Crustopia Admin</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <Link
            href="/admin/logout"
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-red-500/90 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            🚪 Logout
          </Link>
        </nav>

        <p className="mt-8 hidden text-center text-xs text-slate-400 lg:block">
          © {new Date().getFullYear()} Crustopia
        </p>
      </aside>

      {/* Content */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
