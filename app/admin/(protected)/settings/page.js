"use client";

import { useEffect, useState } from "react";

const FIELD_GROUPS = [
  {
    title: "Homepage Hero",
    fields: [
      { key: "hero_badge", label: "Badge text", type: "text" },
      { key: "hero_title", label: "Headline (line 1)", type: "text" },
      { key: "hero_title_highlight", label: "Headline (highlighted line 2)", type: "text" },
      { key: "hero_subtitle", label: "Subtitle", type: "textarea" },
      { key: "hero_cta_text", label: "Call-to-action button text", type: "text" },
    ],
  },
  {
    title: "Homepage Sections",
    fields: [
      { key: "show_features_section", label: "Show \"Why choose us\" features", type: "toggle" },
      { key: "show_bestsellers_section", label: "Show bestsellers / featured items", type: "toggle" },
      { key: "show_offer_banner", label: "Show promotional banner", type: "toggle" },
      { key: "offer_banner_text", label: "Promotional banner text", type: "text" },
    ],
  },
  {
    title: "Business Settings",
    fields: [
      { key: "currency_symbol", label: "Currency symbol", type: "text" },
      { key: "delivery_fee", label: "Delivery fee", type: "number" },
      { key: "free_delivery_above", label: "Free delivery above (0 = disabled)", type: "number" },
      { key: "min_order_amount", label: "Minimum order amount", type: "number" },
      { key: "tax_percent", label: "Tax (%)", type: "number" },
      { key: "opening_hours", label: "Opening hours", type: "text" },
    ],
  },
  {
    title: "Contact & Social",
    fields: [
      { key: "contact_phone", label: "Phone number", type: "text" },
      { key: "contact_email", label: "Email address", type: "text" },
      { key: "contact_address", label: "Store address", type: "text" },
      { key: "social_instagram", label: "Instagram URL", type: "text" },
      { key: "social_facebook", label: "Facebook URL", type: "text" },
      { key: "social_twitter", label: "Twitter / X URL", type: "text" },
    ],
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => setSettings({}));
  }, []);

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setMessage({ type: "success", text: "Settings saved — live on your site now." });
    } catch {
      setMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Loading settings…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
        <p className="text-sm text-slate-500">
          Control your homepage content, business rules, and contact details — changes apply
          across the site immediately, no code changes needed.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6">
        {FIELD_GROUPS.map((group) => (
          <section
            key={group.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="mb-4 text-base font-semibold text-slate-900">{group.title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <div
                  key={field.key}
                  className={field.type === "textarea" ? "sm:col-span-2" : ""}
                >
                  {field.type === "toggle" ? (
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{field.label}</span>
                      <input
                        type="checkbox"
                        checked={settings[field.key] === "true"}
                        onChange={(e) => update(field.key, e.target.checked ? "true" : "false")}
                        className="h-5 w-9 cursor-pointer accent-orange-500"
                      />
                    </label>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">{field.label}</label>
                      {field.type === "textarea" ? (
                        <textarea
                          rows={3}
                          value={settings[field.key] ?? ""}
                          onChange={(e) => update(field.key, e.target.value)}
                          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        />
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          value={settings[field.key] ?? ""}
                          onChange={(e) => update(field.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          {message ? (
            <p
              className={`text-sm font-medium ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-orange-500 px-6 py-2.5 font-semibold text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
