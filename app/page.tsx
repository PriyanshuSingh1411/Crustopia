"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Settings = Record<string, string>;
type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
};

export default function Home() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings))
      .catch(() => setSettings(null));

    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const products: (Product & { is_featured?: boolean })[] = data.products || [];
        const picked = products.filter((p) => p.is_featured).slice(0, 6);
        setFeatured(picked.length ? picked : products.slice(0, 6));
      })
      .catch(() => setFeatured([]));
  }, []);

  const s = settings || {};
  const showFeatures = s.show_features_section !== "false";
  const showBestsellers = s.show_bestsellers_section !== "false";
  const showOfferBanner = s.show_offer_banner === "true" && s.offer_banner_text;

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* FULL PAGE VIDEO BACKGROUND */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed left-0 top-0 -z-10 h-full w-full object-cover"
      >
        <source src={s.hero_video_url || "/pizza-bg.mp4"} type="video/mp4" />
      </video>
      <div className="fixed inset-0 -z-10 bg-black/40" />

      {showOfferBanner && (
        <div className="bg-orange-600 px-4 py-2.5 text-center text-sm font-medium">
          {s.offer_banner_text}
        </div>
      )}

      {/* HERO SECTION */}
      <section className="flex min-h-[90vh] items-center justify-center px-6 text-center sm:min-h-screen">
        <div>
          <span className="mb-6 inline-block rounded-full bg-white/20 px-5 py-2 text-sm font-semibold backdrop-blur">
            🚀 {s.hero_badge || "Fast • Fresh • Delicious"}
          </span>

          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-7xl">
            {s.hero_title || "Fresh Pizza"} <br />
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              {s.hero_title_highlight || "Delivered Hot"}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-white/90 sm:text-lg md:text-xl">
            {s.hero_subtitle ||
              "Handcrafted pizzas made with premium ingredients, baked to perfection and delivered straight to your door."}
          </p>

          <div className="mt-10">
            <Link
              href="/menu"
              className="inline-block rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 font-semibold shadow-xl transition-transform hover:scale-105 sm:px-10"
            >
              {s.hero_cta_text || "Order Now"}
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      {showFeatures && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 text-center sm:grid-cols-3 sm:gap-10">
            <div className="rounded-2xl bg-white/10 p-8 shadow-lg backdrop-blur">
              <div className="mb-4 text-4xl">⚡</div>
              <h3 className="mb-2 font-bold">Fast Delivery</h3>
              <p className="text-gray-200">Hot and fresh pizzas delivered in under 30 minutes.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-8 shadow-lg backdrop-blur">
              <div className="mb-4 text-4xl">🧀</div>
              <h3 className="mb-2 font-bold">Premium Ingredients</h3>
              <p className="text-gray-200">Finest cheese, fresh veggies, and authentic sauces.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-8 shadow-lg backdrop-blur">
              <div className="mb-4 text-4xl">📱</div>
              <h3 className="mb-2 font-bold">Easy Ordering</h3>
              <p className="text-gray-200">Simple, smooth, and secure online ordering experience.</p>
            </div>
          </div>
        </section>
      )}

      {/* BESTSELLERS / FEATURED SECTION */}
      {showBestsellers && featured.length > 0 && (
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
              🔥 Customer Favorites
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <Link
                  key={p.id}
                  href={`/menu/${p.id}`}
                  className="group overflow-hidden rounded-2xl bg-white/10 shadow-lg backdrop-blur transition hover:bg-white/15"
                >
                  <div className="aspect-video w-full overflow-hidden bg-black/20">
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-4 text-left">
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="mt-1 font-bold text-orange-300">
                      {s.currency_symbol || "₹"}
                      {p.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
