"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-10">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur"
      >
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Admin Panel</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2.5 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            placeholder="admin@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            required
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in…" : "Login"}
        </button>

        <p className="text-center text-xs text-slate-400">
          Setting up this store for the first time?{" "}
          <span
            onClick={() => router.push("/admin/register")}
            className="cursor-pointer font-medium text-slate-500 underline hover:text-slate-700"
          >
            Create the first admin account
          </span>
        </p>
      </form>
    </div>
  );
}
