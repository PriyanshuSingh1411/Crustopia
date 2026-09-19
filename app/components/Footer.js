"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings))
      .catch(() => setSettings(null));
  }, []);

  const s = settings || {};

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              🍕 {s.site_name || "Crustopia"}
            </div>
            <p className="mt-2 max-w-xs text-sm text-slate-400">
              {s.hero_subtitle ||
                "Handcrafted pizzas made with premium ingredients, delivered hot."}
            </p>
            {(s.social_instagram || s.social_facebook || s.social_twitter) && (
              <div className="mt-4 flex gap-3 text-sm">
                {s.social_instagram && (
                  <a href={s.social_instagram} target="_blank" rel="noreferrer" className="hover:text-white">
                    Instagram
                  </a>
                )}
                {s.social_facebook && (
                  <a href={s.social_facebook} target="_blank" rel="noreferrer" className="hover:text-white">
                    Facebook
                  </a>
                )}
                {s.social_twitter && (
                  <a href={s.social_twitter} target="_blank" rel="noreferrer" className="hover:text-white">
                    Twitter
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Quick Links
            </h4>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/menu" className="hover:text-white">Menu</Link>
              <Link href="/orders" className="hover:text-white">My Orders</Link>
              <Link href="/cart" className="hover:text-white">Cart</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Contact
            </h4>
            <div className="mt-3 space-y-2 text-sm text-slate-400">
              {s.contact_phone && <p>📞 {s.contact_phone}</p>}
              {s.contact_email && <p>✉️ {s.contact_email}</p>}
              {s.contact_address && <p>📍 {s.contact_address}</p>}
              {s.opening_hours && <p>🕒 {s.opening_hours}</p>}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {s.site_name || "Crustopia"}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
