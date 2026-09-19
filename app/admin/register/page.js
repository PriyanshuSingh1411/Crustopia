"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// This page now only creates the very FIRST admin account for a fresh
// deployment (bootstrap). Once one admin exists, self-service admin
// creation here is disabled — new staff accounts are created from
// /admin/users by an already-logged-in admin instead. The old version
// of this page (and its API route) let ANYONE create an admin account
// at any time, with no auth check at all.
export default function AdminRegister() {
  const router = useRouter();
  const [status, setStatus] = useState("checking"); // checking | open | closed
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/register-status")
      .then((res) => res.json())
      .then((data) => setStatus(data.bootstrapAllowed ? "open" : "closed"))
      .catch(() => setStatus("closed"));
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed. Try again.");
      } else {
        setSuccess("Admin account created! Redirecting to login…");
        setTimeout(() => router.push("/auth/admin/login"), 1200);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 p-8 shadow-2xl">
        <div className="mb-2 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">
            First-Time Admin Setup
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create the first admin account for this store
          </p>
        </div>

        {status === "checking" && (
          <p className="mt-6 text-center text-sm text-slate-500">Checking setup status…</p>
        )}

        {status === "closed" && (
          <div className="mt-6 space-y-4 text-center">
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              An admin account already exists for this store. New staff
              accounts are created from inside the admin dashboard.
            </div>
            <button
              onClick={() => router.push("/auth/admin/login")}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Admin Login
            </button>
          </div>
        )}

        {status === "open" && (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-center text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 px-3 py-2.5 text-center text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <input
                required
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                required
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                required
                type="password"
                minLength={8}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating Account…" : "Create Admin Account"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already set up?{" "}
              <span
                onClick={() => router.push("/auth/admin/login")}
                className="cursor-pointer font-medium text-blue-600 hover:text-blue-700"
              >
                Login
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
