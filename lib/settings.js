import db from "./db";

export const DEFAULT_SETTINGS = {
  site_name: "Crustopia",
  hero_badge: "Fast • Fresh • Delicious",
  hero_title: "Fresh Pizza",
  hero_title_highlight: "Delivered Hot",
  hero_subtitle:
    "Handcrafted pizzas made with premium ingredients, baked to perfection and delivered straight to your door.",
  hero_cta_text: "Order Now",
  hero_video_url: "/pizza-bg.mp4",
  contact_phone: "",
  contact_email: "",
  contact_address: "",
  opening_hours: "10:00 AM - 11:00 PM, every day",
  delivery_fee: "0",
  free_delivery_above: "0",
  min_order_amount: "0",
  tax_percent: "0",
  currency_symbol: "₹",
  show_features_section: "true",
  show_bestsellers_section: "true",
  show_offer_banner: "false",
  offer_banner_text: "",
  social_instagram: "",
  social_facebook: "",
  social_twitter: "",
};

/**
 * Fetch every site_settings row and merge it over the defaults so the
 * app keeps working even before a migration/seed has run, and so a
 * newly-added setting key always has a fallback value.
 */
export async function getSettings() {
  try {
    const [rows] = await db.query("SELECT key, value FROM site_settings");
    const fromDb = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULT_SETTINGS, ...fromDb };
  } catch (err) {
    console.error("SETTINGS LOAD ERROR:", err.message);
    return { ...DEFAULT_SETTINGS };
  }
}

/** Upsert a batch of settings, e.g. { hero_title: "...", tax_percent: "5" } */
export async function saveSettings(entries) {
  const keys = Object.keys(entries).filter((k) => k in DEFAULT_SETTINGS);

  for (const key of keys) {
    const value = String(entries[key] ?? "");
    // NOTE: explicit "RETURNING key" avoids db.js's auto-appended
    // "RETURNING id" (site_settings has no id column, it's keyed on `key`).
    await db.query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
       RETURNING key`,
      [key, value],
    );
  }
}

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
