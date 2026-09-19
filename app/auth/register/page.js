"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
      } else {
        router.push("/auth/login");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: "url('/pizza-reg-bg.jpg')" }}
    >
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-10">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          🍕 Create Account
        </h1>
        <p className="mt-2 text-center text-sm text-white/75">
          Join us and start ordering delicious pizza
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm text-white/80">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base outline-none transition placeholder:text-white/50 focus:border-orange-400 focus:bg-white/15"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-white/80">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base outline-none transition placeholder:text-white/50 focus:border-orange-400 focus:bg-white/15"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-white/80">Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base outline-none transition placeholder:text-white/50 focus:border-orange-400 focus:bg-white/15"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-orange-600 py-3.5 font-semibold shadow-lg shadow-orange-900/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating Account…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/75">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="font-semibold text-orange-400 hover:text-orange-300"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
