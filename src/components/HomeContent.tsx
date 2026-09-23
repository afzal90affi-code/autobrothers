"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { client } from "../lib/sanityClient";
import SplashScreen from "./animations/splashscreen";
import VehicleSelector from "./VehicleSelector";
import { Car, ChevronRight } from "lucide-react";

type Post = { _id: string; title: string; slug: string; image?: string; date: string; excerpt?: string };
type Prod = {
  _id: string; title: string; slug: string; price: string;
  image?: string; condition?: string; model?: string;
  category?: string; subCat?: string; newArrival?: boolean;
};
type Cat = { _id: string; title: string; slug: string; img?: string };

/* ---------- helpers ---------- */

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "";

const conditionStyle: Record<string, string> = {
  Good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  Average: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  Bad: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
};

/* ============================================================
   NOTE: ThemeToggle Navbar wala single toggle use hota hai
============================================================ */

function SectionHead({ emoji, title, sub, href }: { emoji?: string; title: string; sub?: string; href?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-black text-slate-900 sm:text-2xl dark:text-white">
          {emoji ? `${emoji} ` : ""}{title}
        </h2>
        {sub && <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-xs font-bold text-[#F5A623] hover:underline sm:text-sm">
          View All →
        </Link>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-10 text-center dark:border-[#1E3A52] dark:bg-[#0D1F30]/50">
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

function Skeleton({ n = 4, h = "h-52" }: { n?: number; h?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(n)].map((_, i) => (
        <div key={i} className={`${h} animate-pulse rounded-2xl bg-gray-100 dark:bg-[#13293D]`} />
      ))}
    </div>
  );
}

/* ============================================================
   INSTAGRAM STYLE PRODUCT CARD
============================================================ */

function ProductCard({ p }: { p: Prod }) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200/70 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl dark:bg-[#112240] dark:ring-white/[0.06]">

      {p.image ? (
        <img src={p.image} alt={p.title} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#0D1F30] dark:to-[#13293D]">
          <svg className="h-12 w-12 text-gray-300 dark:text-[#1E3A52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7.5v9a1.5 1.5 0 01-.75 1.3l-6.5 3.75a1.5 1.5 0 01-1.5 0L4.75 17.8A1.5 1.5 0 014 16.5v-9a1.5 1.5 0 01.75-1.3l6.5-3.75a1.5 1.5 0 011.5 0l6.5 3.75A1.5 1.5 0 0120 7.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5L12 12l7.5-4.5M12 21v-9" />
          </svg>
        </div>
      )}

      {/* HOVER OVERLAY */}
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/90 via-black/50 to-black/40 opacity-0 backdrop-blur-[2px] transition-all duration-400 group-hover:opacity-100">

        <div className="flex items-start justify-between p-3">
          {p.condition && (
            <span className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${conditionStyle[p.condition] ?? ""}`}>
              {p.condition}
            </span>
          )}
          {p.newArrival && (
            <span className="rounded-lg bg-blue-500/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md">
              New
            </span>
          )}
        </div>

        <div className="p-4">
          {p.model && (
            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#F5A623]">
              {p.model}
            </p>
          )}

          <p className="line-clamp-2 text-sm font-bold leading-snug text-white">
            {p.title}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400">Price</p>
              <p className="text-lg font-black leading-tight text-[#F5A623]">
                Rs {Number(p.price || 0).toLocaleString("en-PK")}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`https://wa.me/?text=${encodeURIComponent(`Hi! I'm interested in: ${p.title} — Rs ${p.price}`)}`, "_blank");
              }}
              aria-label="Order on WhatsApp"
              className="flex h-10 items-center gap-1.5 rounded-xl bg-[#F5A623] px-4 text-[11px] font-black text-[#0A1929] shadow-lg shadow-[#F5A623]/30 transition-transform duration-300 hover:scale-105 active:scale-95">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Order
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE overlay */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 sm:hidden">
        <p className="line-clamp-1 text-[11px] font-bold text-white">{p.title}</p>
        <p className="shrink-0 text-sm font-black text-[#F5A623]">
          Rs {Number(p.price || 0).toLocaleString("en-PK")}
        </p>
      </div>
    </div>
  );
}
/* ============================================================
   1. HERO
============================================================ */

function Hero() {
  const [s, setS] = useState<{ heroImage?: string; heroTitle?: string; heroSub?: string }>({});

  useEffect(() => {
    client.fetch(`*[_type == "siteSettings"][0]{ heroImage, heroTitle, heroSub }`)
      .then((d) => setS(d || {}))
      .catch(() => {});
  }, []);

  return (
    <section className="relative">
      <div className="relative h-[420px] overflow-hidden sm:h-[520px] md:h-[600px]">
        {/* ✅ Apni image: public/hero.jpg — na ho toh fallback */}
        {s?.heroImage ? (
            <img src="/hero"  alt="Hero" className="h-full w-full object-cover" />
        ) : (
          <img
            src="/hero.webp"
            alt="Car engine"
            className="h-full w-full object-cover"
            onError={(e) => {
              // hero.jpg nahi mili toh unsplash fallback
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80";
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:pb-16 md:pb-20">

            {/* ===== STYLISH BRAND NAME ===== */}
            <p className="mb-3 select-none text-3xl font-black italic tracking-tight drop-shadow-lg sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-white via-[#FFD9A0] to-[#F5A623] bg-clip-text text-transparent">
                Auto
              </span>
              <span className="bg-gradient-to-r from-[#F5A623] to-[#FF8A00] bg-clip-text text-transparent">
                Brothers
              </span>
            </p>

            <span className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#0A1929] shadow-lg shadow-[#F5A623]/30 sm:text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
              Pakistan's Trusted Auto Store
            </span>

            {/* ===== HEADING — Cars, Engines, EV/Hybrid, Buying Guides ===== */}
            <h1 className="mt-4 max-w-3xl text-2xl font-black leading-[1.1] text-white drop-shadow-lg sm:text-4xl md:text-5xl">
              {s?.heroTitle || (
                <>
                  Cars, Engines &{" "}
                  <span className="text-[#F5A623]">EV / Hybrid</span>
                  <br />
                  — News &amp; Buying Guides
                </>
              )}
            </h1>

            <p className="mt-4 max-w-xl text-sm text-gray-200 drop-shadow sm:text-lg">
              {s?.heroSub ||
                "Expert reviews, engine guides, EV & hybrid insights — aur new cars buy karne ki poori details. Sab kuch ek jagah."}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#categories"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-7 py-3.5 text-sm font-black text-[#0A1929] shadow-xl shadow-[#F5A623]/30 transition-all hover:scale-105 hover:bg-[#FFB94D] sm:text-base">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                Shop Now
              </a>
              {/* ✅ New Cars hata — Read Blog */}
              <Link href="/blog"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/20 sm:text-base">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 5v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2zm-11 4h8m-8 4h8m-8 4h5" />
                </svg>
                Read Blog
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-semibold text-gray-300 sm:text-xs">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                100% Original Parts
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Japan Imported
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                All Pakistan Delivery
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 animate-bounce md:block">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}


/* ============================================================
   2. NEWS (latest 4 blogs)
============================================================ */

function NewsSection() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    client.fetch<Post[]>(
      `*[_type == "blog" && isPublished != false] | order(date desc) [0...4] {
        _id, title, "slug": slug.current, desc,
        "image": img1.asset->url,
        date
      }`
    ).then(setPosts).catch(() => {});
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <SectionHead emoji="📰" title="Latest News" sub="Car care tips aur updates" href="/blog" />
      {posts.length === 0 ? <Skeleton /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((p) => (
            <Link key={p._id} href={`/blog/${p.slug}`}>
              <div className="group h-full overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200/60 ring-1 ring-gray-100 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl dark:bg-[#112240] dark:shadow-black/20 dark:ring-[#1E3A52] dark:hover:shadow-black/40">
                {p.image ? (
                  <div className="overflow-hidden">
                    <img src={`${p.image}?w=600&auto=format&q=70`} alt={p.title} loading="lazy" className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-gray-50 dark:bg-[#0D1F30]">
                    <svg className="h-8 w-8 text-gray-300 dark:text-[#1E3A52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 5v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2zm-11 4h8m-8 4h8m-8 4h5" />
                    </svg>
                  </div>
                )}
                <div className="space-y-1 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#F5A623]">{fmtDate(p.date)}</p>
                  <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-[#F5A623] dark:text-white">{p.title}</h3>
                  {p.excerpt && <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{p.excerpt}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   3. NEW ARRIVALS
============================================================ */

function NewArrivals() {
  const [prods, setProds] = useState<Prod[]>([]);

  useEffect(() => {
    client.fetch<Prod[]>(
      `*[_type == "product" && newArrival == true] | order(_createdAt desc) [0...8] {
        _id, title, "slug": slug.current, price, condition, model,
        "image": images[0].asset->url,
        "subCat": subcategory->title,
        "category": subcategory->parentCategory->title
      }`
    ).then((d) => {
      if (d?.length) { setProds(d); return; }
      return client.fetch<Prod[]>(
        `*[_type == "product"] | order(_createdAt desc) [0...8] {
          _id, title, "slug": slug.current, price, condition, model,
          "image": images[0].asset->url,
          "subCat": subcategory->title,
          "category": subcategory->parentCategory->title
        }`
      ).then(setProds);
    }).catch(() => {});
  }, []);

  return (
    <section className="bg-gray-50 py-10 dark:bg-[#0D1F30]/60">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHead emoji="✨" title="New Arrivals" sub="Sabse naye products" href="/shop" />
        {prods.length === 0 ? <Skeleton n={4} /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {prods.map((p) => (
              <Link key={p._id} href={`/product/${p.slug}`}>
                <ProductCard p={p} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   4. CATEGORIES (premium cards with images)
============================================================ */

function CategoriesSection() {
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    client.fetch<Cat[]>(
      `*[_type == "category"] | order(coalesce(order, 9999) asc, title asc) {
        _id, title, "slug": slug.current, "img": image.asset->url
      }`
    ).then(setCats).catch(() => {});
  }, []);

  if (cats.length === 0) return null;

  return (
    <section id="categories" className="mx-auto max-w-6xl px-4 py-10">
      <SectionHead
        emoji="📂"
        title="Shop by Category"
        sub="Apni car ke hisaab se parts chuno"
        href="/shop"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cats.map((c) => (
          <Link key={c._id} href={`/shop?cat=${c.slug}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md ring-1 ring-gray-200 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:ring-[#F5A623]/50 dark:ring-[#1E3A52]">

            {c.img ? (
              <img src={`${c.img}?w=600&auto=format&q=70`} alt={c.title} loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#13293D] to-[#0A1929]">
                <span className="text-4xl font-black text-[#F5A623]/30">
                  {c.title?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
              <h3 className="text-sm font-black text-white transition-colors group-hover:text-[#F5A623] sm:text-base">
                {c.title}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-gray-300 opacity-0 transition-all duration-300 group-hover:opacity-100">
                Shop Now
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   4.5. VEHICLE SELECTOR (Select Your Car — app style)
============================================================ */

function VehicleSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <button
          onClick={() => setOpen(true)}
          className="group flex w-full items-center gap-4 rounded-3xl bg-gradient-to-r from-[#0A1929] to-[#13293D] p-5 text-left shadow-xl ring-1 ring-[#F5A623]/30 transition-all hover:scale-[1.01] hover:shadow-2xl sm:p-8"
        >
          <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-[#F5A623] text-[#0A1929] shadow-lg shadow-[#F5A623]/30 transition-transform group-hover:scale-110">
            <Car size={26} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black text-white sm:text-xl">
              Select Your Car
            </span>
            <span className="mt-0.5 block text-xs text-gray-400 sm:text-sm">
              Apni gari chuno — usi ke parts dikhenge
            </span>
          </span>
          <ChevronRight size={22} className="text-[#F5A623] transition-transform group-hover:translate-x-1" />
        </button>
      </section>

      {open && <VehicleSelector onClose={() => setOpen(false)} />}
    </>
  );
}

/* ============================================================
   5. CATEGORY SHOP (pills + filtered products)
============================================================ */

function CategoryShop() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [active, setActive] = useState("all");
  const [prods, setProds] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.fetch<Cat[]>(
      `*[_type == "category"] | order(title asc) { _id, title, "slug": slug.current }`
    ).then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const fields = `
      _id, title, "slug": slug.current, price, condition, model,
      "image": images[0].asset->url,
      "subCat": subcategory->title,
      "category": subcategory->parentCategory->title
    `;
    const query = active === "all"
      ? `*[_type == "product"] | order(_createdAt desc) [0...12] { ${fields} }`
      : `*[_type == "product" && subcategory->parentCategory._id == $catId] | order(_createdAt desc) [0...12] { ${fields} }`;

    client.fetch<Prod[]>(query, { catId: active })
      .then(setProds)
      .catch(() => setProds([]))
      .finally(() => setLoading(false));
  }, [active]);

  const activeCat = cats.find((c) => c._id === active);

  const pill = (id: string, label: string) => (
    <button key={id} onClick={() => setActive(id)}
      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition sm:text-sm ${
        active === id
          ? "bg-[#F5A623] text-white shadow-lg shadow-[#F5A623]/25"
          : "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-slate-900 dark:bg-[#112240] dark:text-gray-400 dark:ring-[#1E3A52] dark:hover:text-white dark:hover:ring-[#F5A623]/50"
      }`}>
      {label}
    </button>
  );

  return (
    <section>
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-[#1E3A52] dark:bg-[#0A1929]/95">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pill("all", "All")}
          {cats.map((c) => pill(c._id, c.title))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <SectionHead
          title={active === "all" ? "All Products" : activeCat?.title || "Products"}
          sub={`${prods.length} products`}
          href="/shop"
        />

        {loading ? (
          <Skeleton n={4} />
        ) : prods.length === 0 ? (
          <Empty text="Is category mein abhi products nahi hain." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {prods.map((p) => (
              <Link key={p._id} href={`/product/${p.slug}`}>
                <ProductCard p={p} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   6. FEATURED SLIDER (max 20)
============================================================ */

function FeaturedSlider() {
  const ref = useRef<HTMLDivElement>(null);
  const [prods, setProds] = useState<Prod[]>([]);

  useEffect(() => {
    client.fetch<Prod[]>(
      `*[_type == "product" && featured == true] | order(_createdAt desc) [0...20] {
        _id, title, "slug": slug.current, price, condition, model,
        "image": images[0].asset->url,
        "subCat": subcategory->title,
        "category": subcategory->parentCategory->title
      }`
    ).then(setProds).catch(() => {});
  }, []);

  const scrollBy = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <section className="bg-gray-50 py-10 dark:bg-[#0D1F30]/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-3">
          <SectionHead emoji="🔥" title="Featured Products" sub="Swipe karo ya arrows dabao" />
          <div className="hidden shrink-0 gap-2 pb-1 sm:flex">
            <button onClick={() => scrollBy(-1)} aria-label="Prev"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 shadow-sm transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:ring-[#1E3A52] dark:hover:bg-[#F5A623]/20 dark:hover:text-[#F5A623]">◀</button>
            <button onClick={() => scrollBy(1)} aria-label="Next"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 shadow-sm transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:ring-[#1E3A52] dark:hover:bg-[#F5A623]/20 dark:hover:text-[#F5A623]">▶</button>
          </div>
        </div>

        {prods.length === 0 ? (
          <Empty text="Featured products nahi mile — admin panel se kisi product ko Featured ON karein." />
        ) : (
          <div ref={ref}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {prods.map((p) => (
              <div key={p._id} className="w-48 shrink-0 snap-start sm:w-56">
                <Link href={`/product/${p.slug}`}>
                  <ProductCard p={p} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   7. SOCIAL PAGES
============================================================ */

const FB_URL = "https://www.facebook.com/profile.php?id=100064020401353";
const IG_URL = "https://instagram.com/autobrothers.pk";
const IG_PROFILE_IMG = "https://i.ibb.co/84814xg5/b16b-5542697ff3a9c-1296x.webp";

function SocialPages() {
  return (
    <section className="border-t border-gray-200 py-14 dark:border-[#1E3A52] md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5A623]">Stay Connected</span>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Follow Our Pages</h2>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* FACEBOOK */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-[#1E3A52] dark:bg-[#13293D]">
            <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-[#1E3A52]">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#1877F2]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">AutoBrothers</h4>
                <p className="text-[10px] text-gray-500">Facebook Page</p>
              </div>
              <a href={FB_URL} target="_blank" rel="noopener noreferrer"
                className="rounded-lg bg-[#1877F2] px-4 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#166FE5]">
                Follow
              </a>
            </div>

            <div className="relative flex h-[300px] items-center justify-center overflow-hidden bg-[#1a1a1a]">
              <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-[#0D1F30] p-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1877F2]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </div>
                <h4 className="text-lg font-bold text-white">AutoBrothers</h4>
                <p className="mb-5 mt-1 text-xs text-gray-400">Visit our Facebook Page</p>
                <a href={FB_URL} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg bg-[#1877F2] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#166FE5]">
                  Open Facebook
                </a>
              </div>

              <iframe
                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D100064020401353&tabs=timeline&width=340&height=300&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true"
                width="340" height="300"
                style={{ border: "none", overflow: "hidden", position: "relative", zIndex: 10, background: "white" }}
                scrolling="no" frameBorder="0" loading="lazy"
                allowFullScreen={true}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
          </div>

          {/* INSTAGRAM */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-[#1E3A52] dark:bg-[#13293D]">
            <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-[#1E3A52]">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">autobrothers.pk</h4>
                <p className="text-[10px] text-gray-500">Instagram Page</p>
              </div>
              <a href={IG_URL} target="_blank" rel="noopener noreferrer"
                className="rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-4 py-1.5 text-[11px] font-bold text-white transition hover:opacity-90">
                Follow
              </a>
            </div>

            <div className="relative flex h-[300px] flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white p-6 text-center dark:from-[#13293D] dark:to-[#0A1929]">
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: `url(${IG_PROFILE_IMG})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="relative z-10 w-full">
                <div className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-pink-500 p-1 shadow-lg shadow-pink-500/20">
                  <img src={IG_PROFILE_IMG} alt="IG Profile" className="h-full w-full rounded-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">AutoBrothers.Pk</h3>
                <p className="mb-4 mt-1 text-xs text-gray-500 dark:text-gray-400">Japan Imported Auto Parts</p>
                <div className="mb-5 flex items-center justify-center gap-6">
                  <div><span className="text-sm font-bold text-slate-900 dark:text-white">540</span><p className="text-[9px] text-gray-500">Posts</p></div>
                  <div><span className="text-sm font-bold text-slate-900 dark:text-white">10.5K</span><p className="text-[9px] text-gray-500">Followers</p></div>
                  <div><span className="text-sm font-bold text-slate-900 dark:text-white">150</span><p className="text-[9px] text-gray-500">Following</p></div>
                </div>
                <a href={IG_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-transform hover:scale-105">
                  Visit Page
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HOME — final assembly
   ✅ SPLASH SCREEN + VEHICLE SELECTOR
============================================================ */

export default function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem("ab_splash_done") === "1") {
      setSplashDone(true);
    }
  }, []);

  return (
    <div className="bg-white text-slate-900 dark:bg-[#0A1929] dark:text-white">
      {!splashDone && (
        <SplashScreen
          onFinish={() => {
            setSplashDone(true);
            sessionStorage.setItem("ab_splash_done", "1");
          }}
        />
      )}

      {splashDone && mounted && (
        <>
          <Hero />
          <NewsSection />
          <NewArrivals />
          <CategoriesSection />
          <VehicleSection />   {/* ✅ Select Your Car */}
          <CategoryShop />
          <FeaturedSlider />
          <SocialPages />
        </>
      )}
    </div>
  );
}