"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ---------- Types ---------- */
type Prod = {
  id: string;
  title: string;
  price: string;
  oldPrice?: string;
  image?: string;
  category?: string;
  catSlug?: string;
  subCategory?: string;
  condition?: string;
  conditionScore?: number;
  mileage?: string;
  warranty?: number;
  qualityChecked?: boolean;
  japanImported?: boolean;
  model?: string;
  brand?: string;
  partNumber?: string;
  featured?: boolean;
  newArrival?: boolean;
  inStock?: boolean;
  description?: string;
};
type Cat = { id: string; name: string; slug: string; image?: string; productCount?: number };

type Props = {
  prods: Prod[];
  cats: Cat[];
  initialCat?: string;
  initialQ?: string;
};

/* ---------- Constants ---------- */
const FB_URL = "https://www.facebook.com/profile.php?id=100064020401353";
const IG_URL = "https://instagram.com/autobrothers.pk";
const IG_PROFILE_IMG = "https://i.ibb.co/84814xg5/b16b-5542697ff3a9c-1296x.webp";
const WHATSAPP_NUMBER = "923222806245";

/* ============================================================
   ✅ PRODUCT CARD — NO NESTED LINKS
   Image apne Link me, details bahar, View Product alag Link
   — koi <a> ke andar <a> nahi = hydration safe
============================================================ */
function ProductCard({ p }: { p: Prod }) {
  const oldPriceNum = p.oldPrice ? Number(String(p.oldPrice).replace(/[^0-9]/g, "")) : 0;
  const newPriceNum = Number(String(p.price).replace(/[^0-9]/g, "")) || 0;
  const discount = oldPriceNum > newPriceNum ? Math.round(((oldPriceNum - newPriceNum) / oldPriceNum) * 100) : 0;

  const imgAlt = `${p.title}${p.condition ? ` — ${p.condition} condition` : ""} used auto part${p.model ? `, fits ${p.model}` : ""} — AutoBrothers Pakistan`;

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-lg bg-white dark:bg-[#112240] border border-gray-200/80 dark:border-[#1E3A52] transition-all duration-300 hover:shadow-md dark:hover:shadow-black/40"
      itemScope
      itemType="https://schema.org/Product"
    >
      {/* IMAGE — apna Link (nested nahi) */}
      <Link href={`/product/${p.id}`} title={p.title}>
        <div className="relative aspect-square overflow-hidden bg-white dark:bg-[#0D1F30]">
          {p.image ? (
            <img
              src={p.image}
              alt={imgAlt}
              loading="lazy"
              width={600}
              height={600}
              itemProp="image"
              className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="h-10 w-10 text-gray-200 dark:text-[#1E3A52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7.5v9a1.5 1.5 0 01-.75 1.3l-6.5 3.75a1.5 1.5 0 01-1.5 0L4.75 17.8A1.5 1.5 0 014 16.5v-9a1.5 1.5 0 01.75-1.3l6.5-3.75a1.5 1.5 0 011.5 0l6.5 3.75A1.5 1.5 0 0120 7.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5L12 12l7.5-4.5M12 21v-9" />
              </svg>
            </div>
          )}
        </div>
      </Link>

      {/* DETAILS */}
      <div className="flex flex-1 flex-col gap-0.5 border-t border-gray-100 dark:border-[#1E3A52] p-3">
        {/* Brand */}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {p.brand || "AUTOBROTHERS"}
        </p>

        {/* Title — plain text (Link andar nahi) */}
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 dark:text-white" itemProp="name">
          {p.title}
        </p>

        {/* Price + Cart */}
        <div className="mt-auto flex items-center justify-between pt-2" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <div>
            <meta itemProp="priceCurrency" content="PKR" />
            <meta itemProp="price" content={String(newPriceNum)} />
            <p className="text-base font-bold text-gray-900 dark:text-white">
              Rs.{newPriceNum.toLocaleString("en-PK")}
            </p>
            {discount > 0 && (
              <p className="text-[10px] text-gray-400 line-through">
                Rs.{oldPriceNum.toLocaleString("en-PK")}
              </p>
            )}
          </div>

          {p.inStock !== false && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I want to order: ${p.title} — Rs ${p.price}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Order on WhatsApp"
              aria-label={`Order ${p.title}`}
              className="flex h-8 w-8 items-center justify-center text-gray-400 transition hover:text-emerald-500"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </a>
          )}
        </div>

        {/* View Product */}
        {p.inStock !== false && (
          <Link
            href={`/product/${p.id}`}
            className="mt-2 flex items-center justify-center gap-1.5 w-full rounded-lg border border-gray-300 dark:border-[#1E3A52] py-2 text-xs font-bold text-gray-700 dark:text-gray-300 transition hover:bg-[#F5A623] hover:border-[#F5A623] hover:text-white dark:hover:text-[#0A1929]"
          >
            View Product
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ---------- Section Head ---------- */
function SectionHead({ tag, title, showArrows, onPrev, onNext }: {
  tag: string; title: string; showArrows?: boolean; onPrev?: () => void; onNext?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623]">{tag}</p>
        <h2 className="text-xl font-black text-slate-900 sm:text-2xl dark:text-white">{title}</h2>
      </div>
      {showArrows && (
        <div className="hidden gap-2 sm:flex">
          <button onClick={onPrev} aria-label="Previous"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:text-gray-400 dark:ring-[#1E3A52] dark:hover:text-[#F5A623]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={onNext} aria-label="Next"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:text-gray-400 dark:ring-[#1E3A52] dark:hover:text-[#F5A623]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= SOCIAL PAGES ================= */
function SocialPages() {
  return (
    <section className="border-t border-gray-200 py-12 dark:border-[#1E3A52] md:py-16">
      <div className="mx-auto max-w-6xl px-4">
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

            <div className="relative flex h-[300px] flex-col items-center justify-center bg-gradient-to-br from-[#13293D] to-[#0A1929] p-6 text-center">
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: `url(${IG_PROFILE_IMG})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="relative z-10 w-full">
                <div className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-pink-500 p-1 shadow-lg shadow-pink-500/20">
                  <img src={IG_PROFILE_IMG} alt="AutoBrothers Instagram Profile" className="h-full w-full rounded-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-white">AutoBrothers.Pk</h3>
                <p className="mb-4 mt-1 text-xs text-gray-400">Japan Imported Auto Parts</p>
                <div className="mb-5 flex items-center justify-center gap-6">
                  <div><span className="text-sm font-bold text-white">540</span><p className="text-[9px] text-gray-500">Posts</p></div>
                  <div><span className="text-sm font-bold text-white">10.5K</span><p className="text-[9px] text-gray-500">Followers</p></div>
                  <div><span className="text-sm font-bold text-white">150</span><p className="text-[9px] text-gray-500">Following</p></div>
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
   SHOP CONTENT
   ✅ KOI BAHAR WALA <Link> PRODUCT CARD PE NAHI — hydration safe
============================================================ */
export default function ShopContent({ prods, cats, initialCat = "", initialQ = "" }: Props) {
  const [active, setActive] = useState(initialCat);
  const [query, setQuery] = useState(initialQ);
  const [brandFilter, setBrandFilter] = useState("");
  const featuredRef = useRef<HTMLDivElement>(null);
  const arrivalsRef = useRef<HTMLDivElement>(null);

  const activeCat = cats.find((c) => c.slug === active);

  /* Clean navbar: junk filter + empty hide */
  const visibleCats = useMemo(() => {
    const junkPatterns = ["test", "delete", "demo", "sample", "dummy", "asdf", "check", "us news"];
    return cats.filter((c) => {
      const title = c.name.toLowerCase().trim();
      const isJunk = junkPatterns.some((j) => title.includes(j));
      if (isJunk) return false;
      if (typeof c.productCount === "number" && c.productCount === 0) return false;
      return true;
    });
  }, [cats]);

  /* Available brands */
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    prods.forEach((p) => { if (p.brand) set.add(p.brand); });
    return Array.from(set).sort();
  }, [prods]);

  const featured = useMemo(() => {
    const f = prods.filter((p) => p.featured);
    return (f.length ? f : prods).slice(0, 10);
  }, [prods]);

  const newArrivals = useMemo(() => {
    const n = prods.filter((p) => p.newArrival);
    return (n.length ? n : prods).slice(0, 10);
  }, [prods]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prods.filter((p) => {
      const catOk = !active || p.catSlug === active;
      const brandOk = !brandFilter || p.brand === brandFilter;
      const qOk = !q ||
        p.title.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.partNumber || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q);
      return catOk && brandOk && qOk;
    });
  }, [prods, active, brandFilter, query]);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: number) =>
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A1929]">

      {/* ===== 1. CATEGORY NAVBAR — center (desktop) ===== */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-[#1E3A52] dark:bg-[#0A1929]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-start md:justify-center overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          <button
            onClick={() => setActive("")}
            className={`relative shrink-0 px-1 py-2 text-sm font-semibold tracking-wide transition-colors duration-300 ${
              !active
                ? "text-[#F5A623]"
                : "text-gray-700 hover:text-[#F5A623] dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            All Parts
            <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] transition-transform duration-300 ${
              !active ? "scale-x-100" : "scale-x-0"
            }`} />
          </button>

          {visibleCats.map((c) => (
            <span key={c.slug} className="flex items-center">
              <span className="mx-3 h-4 w-px shrink-0 bg-gray-300 dark:bg-[#1E3A52]" aria-hidden="true" />
              <button
                onClick={() => setActive(c.slug)}
                className={`relative shrink-0 px-1 py-2 text-sm font-semibold tracking-wide transition-colors duration-300 ${
                  active === c.slug
                    ? "text-[#F5A623]"
                    : "text-gray-700 hover:text-[#F5A623] dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                {c.name}
                <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] transition-transform duration-300 ${
                  active === c.slug ? "scale-x-100" : "scale-x-0"
                }`} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* ===== 2. HERO BANNER ===== */}
      <section className="relative overflow-hidden">
        {activeCat?.image && (
          <img src={activeCat.image} alt={`${activeCat.name} used auto parts — AutoBrothers Pakistan`}
            className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className={`absolute inset-0 ${
          activeCat?.image
            ? "bg-gradient-to-r from-white/90 via-white/70 to-transparent dark:from-[#0A1929]/95 dark:via-[#0A1929]/70"
            : "bg-gradient-to-r from-white via-amber-50/60 to-white dark:from-[#0A1929] dark:via-[#13293D] dark:to-[#0A1929]"
        }`} />

        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-20">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:bg-[#F5A623]/15 dark:text-[#F5A623]">
            Auto Parts Shop
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-5xl dark:text-white">
            {activeCat?.name ? (
              <>USED <span className="text-[#F5A623]">{activeCat.name.toUpperCase()}</span></>
            ) : (
              <>SHOP <span className="text-[#F5A623]">USED AUTO PARTS</span></>
            )}
          </h1>
          <p className="mt-3 max-w-md text-sm text-gray-600 sm:text-base dark:text-gray-300">
            {activeCat?.name
              ? `Quality checked used ${activeCat.name.toLowerCase()} — Japan imported, tested & warranted. All Pakistan delivery.`
              : "Engines, gearboxes, alternators — Japan imported, tested & warranted. Order on WhatsApp."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href="#products"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#F5A623]/30 transition hover:bg-[#D4911E]">
              Browse Parts
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M21 12H3" />
              </svg>
            </a>

            <div className="relative w-full max-w-xs sm:w-auto">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search parts... e.g. corolla, 2ZR, 16800-0D010"
                aria-label="Search products"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-[#F5A623] sm:w-72 dark:border-[#1E3A52] dark:bg-[#13293D] dark:text-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2.5 BRAND FILTER BAR ===== */}
      {availableBrands.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 dark:border-[#1E3A52] dark:bg-[#112240]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">
              🏷️ Brand:
            </span>
            <button
              onClick={() => setBrandFilter("")}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                !brandFilter
                  ? "bg-[#F5A623] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#1E3A52] dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              All Brands
            </button>
            {availableBrands.map((b) => (
              <button
                key={b}
                onClick={() => setBrandFilter(brandFilter === b ? "" : b)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                  brandFilter === b
                    ? "bg-[#F5A623] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#1E3A52] dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== 3. NEW ARRIVALS — ✅ ProductCard direct (Link wrapper NAHI) ===== */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <SectionHead tag="Latest" title="New Arrivals" showArrows
            onPrev={() => scroll(arrivalsRef, -1)} onNext={() => scroll(arrivalsRef, 1)} />
          <div ref={arrivalsRef}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {newArrivals.map((p) => (
              <div key={p.id} className="w-48 shrink-0 snap-start sm:w-56">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== 4. FEATURED SLIDER — ✅ direct ===== */}
      {featured.length > 0 && (
        <section className="bg-white py-8 dark:bg-[#0D1F30]/60">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHead tag="Featured" title="Hot Deals" showArrows
              onPrev={() => scroll(featuredRef, -1)} onNext={() => scroll(featuredRef, 1)} />
            <div ref={featuredRef}
              className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {featured.map((p) => (
                <div key={p.id} className="w-48 shrink-0 snap-start sm:w-56">
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 5. ALL PRODUCTS GRID — ✅ direct, key card pe ===== */}
      <section id="products" className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl dark:text-white">
              {activeCat?.name || "All Products"}
              {brandFilter && <span className="text-[#F5A623]"> — {brandFilter}</span>}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {query ? `"${query}" — ` : ""}{filtered.length} products
            </p>
          </div>
          {(active || query || brandFilter) && (
            <button onClick={() => { setActive(""); setQuery(""); setBrandFilter(""); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-[#1E3A52] dark:bg-[#13293D] dark:text-gray-300 dark:hover:bg-[#112240]">
              Clear Filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white py-14 text-center ring-1 ring-gray-100 dark:bg-[#112240] dark:ring-[#1E3A52]">
            <p className="text-sm font-bold text-slate-700 dark:text-white">Koi product nahi mila</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Doosri category ya brand try karo, ya search clear karo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* ===== 6. SOCIAL PAGES ===== */}
      <SocialPages />
    </div>
  );
}