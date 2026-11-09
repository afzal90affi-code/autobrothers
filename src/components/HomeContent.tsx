"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { client } from "../lib/sanityClient";
import SplashScreen from "./animations/splashscreen";
import VehicleSelector from "./VehicleSelector";
import { Car, ChevronRight } from "lucide-react";

/* ============================================================
   HOME CONTENT ✅ v4 — FEATURED UPAR + SHOP WAALA PRODUCT CARD
   ------------------------------------------------------------
   ✅ 1. Featured Products ab NEW ARRIVALS ke NEECHE (upar shift)
   ✅ 2. ProductCard bilkul ShopContent wala: white card +
        image top (object-contain) + brand + price/oldPrice
        discount + WhatsApp cart icon + "View Product" button
        — home aur shop pe SAME look
   ✅ 3. Saare sliders MOBILE FRIENDLY: swipe + snap scroll,
        arrows sirf desktop pe (hidden sm:flex)
   ✅ 4. Main Categories (News ke neeche) — slide style
   ✅ 5. Shop by Category — har main category ki slide row +
        attached categories slider + Other Categories fallback;
        agar Sanity me mainCategory attach hi na ho to purana
        flat grid (khali section kabhi nahi dikhega)
   ✅ 6. Blog fixes: slug na ho to post skip, image na ho to
        placeholder, khali hone par section hide (skeleton
        hamesha nahi ghoomega)
============================================================ */

/* ============================================================
   TYPES
============================================================ */
type Prod = {
  _id: string; title: string; slug: string;
  price?: string | number; oldPrice?: string | number;
  image?: string; condition?: string; conditionScore?: number;
  mileage?: string; warranty?: number; qualityChecked?: boolean;
  japanImported?: boolean; model?: string; brand?: string;
  partNumber?: string; featured?: boolean; newArrival?: boolean;
  inStock?: boolean; description?: string;
  createdAt?: string;
  category?: string; catSlug?: string; subCategory?: string; subSlug?: string;
};
type Cat = {
  _id: string; title: string; slug: string; img?: string;
  mainId?: string; mainTitle?: string; mainSlug?: string;
};
type MainCat = { _id: string; title: string; slug: string; img?: string };
type SubDoc = {
  _id: string; title: string; slug?: string; img?: string;
  parentId?: string; parentTitle?: string; parentSlug?: string;
};
type SubNode = { key: string; name: string; slug: string; img?: string; count: number };
type ParentNode = {
  key: string; name: string; slug: string; img?: string; _id?: string;
  synthetic?: boolean; subs: SubNode[]; prods: Prod[];
};

/* ============================================================
   HELPERS
============================================================ */
const WA_NUMBER = "923222806245"; // ✅ apna number

/* ✅ WATERMARK helper — har external image /api/watermark route se guzar kar
   aati hai, server par "autobrothers.pk" bake hota hai */
const wmSrc = (url: string, w: number, q: number) =>
  `/api/watermark?src=${encodeURIComponent(url)}&w=${w}&q=${q}`;

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "";

const norm = (s?: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
const slugify = (s?: string) =>
  norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const titleCase = (s?: string) =>
  (s || "").replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const JUNK = ["test", "delete", "demo", "sample", "dummy", "asdf", "check", "us news"];
const isJunk = (t: string) => JUNK.some((j) => t.includes(j));

/* ============================================================
   ✅ CATEGORY TREE BUILDER — main categories + sub-categories
   3 sources mil kar tree banate hain:
   1) Sanity "category" docs (main)
   2) Sanity "subcategory" docs (parentCategory link ke sath)
   3) Products khud (category + subCategory fields se) — agar Sanity
      se kuch na mile to bhi har sub-category tree me aayegi
============================================================ */
function buildTree(cats: Cat[], subDocs: SubDoc[], prods: Prod[]): ParentNode[] {
  const parents = new Map<string, ParentNode>();

  const ensureParent = (
    name: string, slug: string, img?: string, _id?: string, synthetic?: boolean
  ): ParentNode => {
    const key = norm(name) || norm(slug);
    const existing = key ? parents.get(key) : undefined;
    if (existing) {
      if (!existing.img && img) existing.img = img;
      if (!existing._id && _id) existing._id = _id;
      return existing;
    }
    const node: ParentNode = {
      key: key || slugify(slug || name || "cat"),
      name: (name || slug || "Category").trim(),
      slug: (slug || slugify(name || "category")).trim(),
      img, _id, synthetic,
      subs: [], prods: [],
    };
    parents.set(node.key, node);
    return node;
  };

  /* fuzzy — slug/name dono se parent dhundo */
  const findParent = (slug?: string, name?: string): ParentNode | undefined => {
    const s = norm(slug); const n = norm(name);
    if (!s && !n) return undefined;
    for (const v of parents.values()) {
      const vs = norm(v.slug); const vn = norm(v.name);
      if (s && (vs === s || vn === s)) return v;
      if (n && (vn === n || vs === n)) return v;
      if (s && vs.length >= 4 && s.length >= 4 && (vs.includes(s) || s.includes(vs))) return v;
      if (n && vn.length >= 4 && n.length >= 4 && (vn.includes(n) || n.includes(vn))) return v;
    }
    return undefined;
  };

  /* ---- Step 0: Sanity cats classify — kaun parent, kaun kisi aur ki sub ---- */
  const goodCats = (cats || []).filter(
    (c) => c?.title && !isJunk((c.title || "").toLowerCase())
  );
  const subCats: { c: Cat; parentSlug?: string; parentTitle?: string }[] = [];

  goodCats.forEach((c) => {
    const t = norm(c.title);
    let subOf: { parentSlug?: string; parentTitle?: string } | null = null;
    for (const p of prods || []) {
      const s = norm(p.subCategory);
      if (!s) continue;
      const same = s === t || (t.length >= 4 && s.includes(t)) || (s.length >= 4 && t.includes(s));
      if (!same) continue;
      /* ye product jis parent ka hai wo is cat khud nahi honi chahiye */
      const pCat = norm(p.category);
      const selfCat =
        pCat && (pCat === t || norm(p.catSlug) === norm(c.slug) || pCat.includes(t) || t.includes(pCat));
      if (!selfCat) { subOf = { parentSlug: p.catSlug, parentTitle: p.category }; break; }
    }
    if (subOf) subCats.push({ c, parentSlug: subOf.parentSlug, parentTitle: subOf.parentTitle });
    else ensureParent(c.title, c.slug || slugify(c.title), c.img, c._id);
  });

  /* ---- Step 1: Sanity subcategory docs — parent ke sath attach ---- */
  (subDocs || []).forEach((sd) => {
    if (!sd?.title) return;
    let parent =
      (sd.parentId && [...parents.values()].find((v) => v._id && v._id === sd.parentId)) ||
      findParent(sd.parentSlug, sd.parentTitle);
    if (!parent) {
      parent = ensureParent(
        sd.parentTitle || sd.parentSlug || "Other Parts",
        sd.parentSlug || slugify(sd.parentTitle || "other-parts"),
        undefined, undefined, true
      );
    }
    const sKey = norm(sd.title);
    let sub = parent.subs.find((x) => x.key === sKey);
    if (!sub) {
      sub = { key: sKey, name: sd.title, slug: sd.slug || slugify(sd.title), img: sd.img, count: 0 };
      parent.subs.push(sub);
    } else if (!sub.img && sd.img) {
      sub.img = sd.img;
    }
  });

  /* ---- Step 2: Sanity cats jo actually sub nikli ---- */
  subCats.forEach(({ c, parentSlug, parentTitle }) => {
    const parent =
      findParent(parentSlug, parentTitle) ||
      ensureParent(parentTitle || "Other Parts", slugify(parentTitle || "other-parts"), undefined, undefined, true);
    const sKey = norm(c.title);
    if (!parent.subs.find((x) => x.key === sKey)) {
      parent.subs.push({ key: sKey, name: c.title, slug: c.slug || slugify(c.title), img: c.img, count: 0 });
    }
  });

  /* ---- Step 3: products — parent group + sub counts ----
     (Sanity subcategory docs na mile to bhi products se poora tree ban jata hai) */
  (prods || []).forEach((p) => {
    const pName = (p.category || "").trim();
    const pSlug = (p.catSlug || "").trim();
    if (!norm(pName) && !norm(pSlug)) return;
    let parent = findParent(pSlug, pName);
    if (!parent) parent = ensureParent(pName || pSlug, pSlug || slugify(pName), undefined, undefined, true);
    parent.prods.push(p);
    const sName = (p.subCategory || "").trim();
    if (!sName) return;
    const sKey = norm(sName);
    let sub = parent.subs.find((x) => x.key === sKey);
    if (!sub) {
      sub = {
        key: sKey,
        name: titleCase(sName),
        slug: p.subSlug || slugify(`${parent.slug}-${sName}`),
        count: 0,
      };
      parent.subs.push(sub);
    }
    sub.count++;
    if (!sub.img && p.image) sub.img = p.image;
  });

  /* finalize */
  const arr = [...parents.values()];
  arr.forEach((v) => {
    if (!v.img && v.prods.length && v.prods[0].image) v.img = v.prods[0].image;
    v.subs.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  });
  const real = arr.filter((v) => !v.synthetic);
  const syn = arr.filter((v) => v.synthetic).sort((a, b) => b.prods.length - a.prods.length);
  return [...real, ...syn];
}

/* ============================================================
   GROQ — product fields (ShopContent jaise hi fields)
============================================================ */
const PRODUCT_FIELDS = `
  _id, title, "slug": slug.current, price, oldPrice, condition, conditionScore,
  mileage, warranty, qualityChecked, japanImported, model,
  "brand": coalesce(brand->title, brand),
  partNumber, featured, newArrival, inStock, description,
  "createdAt": _createdAt,
  "image": images[0].asset->url,
  "subCategory": subcategory->title,
  "subSlug": subcategory->slug.current,
  "category": subcategory->parentCategory->title,
  "catSlug": subcategory->parentCategory->slug.current
`;

const MAIN_CATS_QUERY = `*[_type == "mainCategory"] | order(coalesce(order, 9999) asc, title asc) {
  _id, title, "slug": slug.current, "img": image.asset->url
}`;

const CATS_QUERY = `*[_type == "category"] | order(coalesce(order, 9999) asc, title asc) {
  _id, title, "slug": slug.current, "img": image.asset->url,
  "mainId": mainCategory->_id,
  "mainTitle": mainCategory->title,
  "mainSlug": mainCategory->slug.current
}`;

const SUBS_QUERY = `*[_type == "subcategory"] | order(title asc) {
  _id, title, "slug": slug.current, "img": image.asset->url,
  "parentId": parentCategory->_id,
  "parentTitle": parentCategory->title,
  "parentSlug": parentCategory->slug.current
}`;

/* ---------- Section Head ---------- */
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

/* ---------- ✅ SLIDER ARROWS — sirf desktop (mobile pe swipe hai) ---------- */
function SliderArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="hidden shrink-0 gap-2 pb-1 sm:flex">
      <button onClick={onPrev} aria-label="Previous"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 shadow-sm transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:ring-[#1E3A52] dark:hover:bg-[#F5A623]/20 dark:hover:text-[#F5A623]">◀</button>
      <button onClick={onNext} aria-label="Next"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 shadow-sm transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:ring-[#1E3A52] dark:hover:bg-[#F5A623]/20 dark:hover:text-[#F5A623]">▶</button>
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

function SliderSkeleton({ n = 4, cls = "aspect-[4/3] w-56 sm:w-64" }: { n?: number; cls?: string }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[...Array(n)].map((_, i) => (
        <div key={i} className={`${cls} shrink-0 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#13293D]`} />
      ))}
    </div>
  );
}

/* ============================================================
   ✅ PRODUCT CARD — BILKUL SHOPCONTENT WAALA (v4)
   White card + image top (object-contain) + brand + price +
   discount + WhatsApp cart icon + View Product button.
   NO NESTED LINKS (hydration safe) — card ke andar apne
   links hain, isliye card ko kabhi <Link> me wrap na karo!
============================================================ */
function ProductCard({ p }: { p: Prod }) {
  const oldPriceNum = p.oldPrice ? Number(String(p.oldPrice).replace(/[^0-9]/g, "")) : 0;
  const newPriceNum = Number(String(p.price).replace(/[^0-9]/g, "")) || 0;
  const discount = oldPriceNum > newPriceNum ? Math.round(((oldPriceNum - newPriceNum) / oldPriceNum) * 100) : 0;

  const imgAlt = `${p.title}${p.condition ? ` — ${p.condition} condition` : ""} used auto part${p.model ? `, fits ${p.model}` : ""} — AutoBrothers Pakistan`;

  /* ✅ WATERMARK — image seedha nahi, watermark route se */
  const imgSrc = p.image ? wmSrc(p.image, 600, 70) : null;
  const href = `/product/${p.slug || p._id}`;

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-lg bg-white dark:bg-[#112240] border border-gray-200/80 dark:border-[#1E3A52] transition-all duration-300 hover:shadow-md dark:hover:shadow-black/40"
      itemScope
      itemType="https://schema.org/Product"
    >
      {/* IMAGE — apna Link (nested nahi) */}
      <Link href={href} title={p.title}>
        <div className="relative aspect-square overflow-hidden bg-white dark:bg-[#0D1F30]">
          {imgSrc ? (
            <img
              src={imgSrc}
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

        {/* Price + WhatsApp cart */}
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
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi! I want to order: ${p.title} — Rs ${p.price}`)}`}
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
            href={href}
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

/* ============================================================
   ✅ CATEGORY CARD — slide cards (main categories + attached
   categories dono ke liye same style)
============================================================ */
function CategoryCard({ title, img, href }: { title: string; img?: string; href: string }) {
  return (
    <Link
      href={href}
      className="group relative aspect-[4/3] w-56 shrink-0 snap-start overflow-hidden rounded-2xl shadow-md ring-1 ring-gray-200 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:ring-[#F5A623]/50 sm:w-64 dark:ring-[#1E3A52]"
    >
      {img ? (
        <img
          src={wmSrc(img, 600, 70)}
          alt={`Used ${title} auto parts — AutoBrothers Pakistan`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#13293D] to-[#0A1929]">
          <span className="text-4xl font-black text-[#F5A623]/30">
            {title?.charAt(0)?.toUpperCase()}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
        <h3 className="text-sm font-black text-white transition-colors group-hover:text-[#F5A623] sm:text-base">
          {title}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-gray-300 opacity-0 transition-all duration-300 group-hover:opacity-100">
          Shop Now
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </p>
      </div>
    </Link>
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
        <img
          src="/hero.webp"
          alt="AutoBrothers — used car engines and auto parts Pakistan"
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80";
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:pb-16 md:pb-20">

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
              Pakistan&apos;s Trusted Auto Store
            </span>

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
              <Link href="/blog"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/20 sm:text-base">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
   2. NEWS (BLOG) ✅ v4 FIXES
   - slug na ho to post skip (broken link kabhi nahi)
   - image na ho to placeholder (khali safed patti nahi)
   - posts hi na hon / query fail ho to section HIDE
     (pehle skeleton hamesha ghoomta rehta tha)
============================================================ */
type Post = { _id: string; title: string; slug: string; image?: string; date: string; desc?: string };

function NewsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    client.fetch<Post[]>(
      `*[_type == "blog" && isPublished != false && defined(slug.current)] | order(date desc) [0...4] {
        _id, title, "slug": slug.current, desc,
        "image": img1.asset->url,
        date
      }`
    ).then((d) => {
      setPosts((d || []).filter((p) => p.slug));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  /* ✅ khali hone par section gayab — skeleton forever fault fix */
  if (loaded && posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <SectionHead emoji="📰" title="Latest News" sub="Car care tips aur updates" href="/blog" />
      {posts.length === 0 ? <Skeleton /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((p) => (
            <Link key={p._id} href={`/blog/${p.slug}`}>
              <div className="group h-full overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200/60 ring-1 ring-gray-100 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl dark:bg-[#112240] dark:shadow-black/20 dark:ring-[#1E3A52] dark:hover:shadow-black/40">
                <div className="overflow-hidden">
                  {p.image ? (
                    /* ✅ WATERMARK route se */
                    <img
                      src={wmSrc(p.image, 600, 70)}
                      alt={`${p.title} — AutoBrothers car care blog`}
                      loading="lazy"
                      width={600}
                      height={300}
                      className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    /* ✅ image na ho to placeholder — khali jagah nahi */
                    <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-[#13293D] to-[#0A1929]">
                      <span className="text-3xl">📰</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#F5A623]">{fmtDate(p.date)}</p>
                  <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-[#F5A623] dark:text-white">{p.title}</h3>
                  {p.desc && <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{p.desc}</p>}
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
   3. MAIN CATEGORIES — News ke NEECHE, slide style ✅
   - desktop: ◀▶ arrows | mobile: swipe (snap scroll)
   - mainCategory docs na hon to section gayab
============================================================ */
function MainCategoriesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [mainCats, setMainCats] = useState<MainCat[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    client.fetch<MainCat[]>(MAIN_CATS_QUERY)
      .then((d) => { setMainCats(d || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const scrollDir = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  const cats = mainCats.filter(
    (c) => c?.title && c?.slug && !isJunk(norm(c.title))
  );

  if (loaded && cats.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <SectionHead
          emoji="🏷️"
          title="Main Categories"
          sub="Japan imported parts ke main groups"
          href="/shop"
        />
        <SliderArrows onPrev={() => scrollDir(-1)} onNext={() => scrollDir(1)} />
      </div>

      {cats.length === 0 ? (
        <SliderSkeleton />
      ) : (
        <div
          ref={ref}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cats.map((c) => (
            <CategoryCard
              key={c._id}
              title={c.title}
              img={c.img}
              href={`/shop?cat=${c.slug}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   4. NEW ARRIVALS — grid, SHOP WAALA CARD (outer Link NAHI)
============================================================ */
function NewArrivals() {
  const [prods, setProds] = useState<Prod[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    client.fetch<Prod[]>(
      `*[_type == "product" && newArrival == true] | order(_createdAt desc) [0...8] { ${PRODUCT_FIELDS} }`
    ).then((d) => {
      if (d?.length) { setProds(d); setLoaded(true); return; }
      return client.fetch<Prod[]>(
        `*[_type == "product"] | order(_createdAt desc) [0...8] { ${PRODUCT_FIELDS} }`
      ).then((d2) => { setProds(d2 || []); setLoaded(true); });
    }).catch(() => setLoaded(true));
  }, []);

  return (
    <section className="bg-gray-50 py-10 dark:bg-[#0D1F30]/60">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHead emoji="✨" title="New Arrivals" sub="Sabse naye products" href="/shop" />
        {prods.length === 0 ? <Skeleton n={4} /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {prods.map((p) => (
              <ProductCard key={p._id} p={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   5. FEATURED SLIDER ✅ v4 — NEW ARRIVALS KE NEECHE (upar shift)
   - slide style: mobile swipe + snap, desktop arrows
   - featured products na hon to section gayab (khali box nahi)
============================================================ */
function FeaturedSlider() {
  const ref = useRef<HTMLDivElement>(null);
  const [prods, setProds] = useState<Prod[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    client.fetch<Prod[]>(
      `*[_type == "product" && featured == true] | order(_createdAt desc) [0...20] { ${PRODUCT_FIELDS} }`
    ).then((d) => { setProds(d || []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const scrollDir = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  if (loaded && prods.length === 0) return null;

  return (
    <section className="bg-gray-50 py-10 dark:bg-[#0D1F30]/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <SectionHead emoji="🔥" title="Featured Products" sub="Hamari recommended picks" />
          <SliderArrows onPrev={() => scrollDir(-1)} onNext={() => scrollDir(1)} />
        </div>

        {prods.length === 0 ? (
          <SliderSkeleton cls="h-80 w-48 sm:w-56" />
        ) : (
          <div
            ref={ref}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {prods.map((p) => (
              <div key={p._id} className="w-48 shrink-0 snap-start sm:w-56">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   6. SHOP BY CATEGORY ✅ v4 — MAIN CATEGORY GROUPED SLIDE ROWS
   - har main category ki apni row, uski attached categories
     slider style me (mobile swipe + desktop arrows)
   - mainCategory se attach na hui categories → "Other Categories"
   - ✅ FALLBACK: Sanity me mainCategory docs/attach hi na hon
     to purana flat grid (khali section kabhi nahi)
============================================================ */
function CategoryGroupRow({ main, subs, alt, emoji }: {
  main: MainCat; subs: Cat[]; alt?: boolean; emoji?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollDir = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  const viewAll = main.slug ? `/shop?cat=${main.slug}` : "/shop";

  return (
    <section className={`py-8 ${alt ? "bg-gray-50 dark:bg-[#0D1F30]/60" : ""}`}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 sm:text-xl dark:text-white">
              {emoji || "🗂️"} {main.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{subs.length} categories</p>
          </div>
          <div className="flex items-center gap-2">
            <SliderArrows onPrev={() => scrollDir(-1)} onNext={() => scrollDir(1)} />
            <Link
              href={viewAll}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:border-[#F5A623] hover:bg-[#F5A623] hover:text-white dark:border-[#1E3A52] dark:bg-[#13293D] dark:text-gray-300 dark:hover:text-white"
            >
              View All
            </Link>
          </div>
        </div>

        {/* ✅ MOBILE FRIENDLY SLIDER — swipe + snap */}
        <div
          ref={ref}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {subs.map((s) => (
            <CategoryCard
              key={s._id}
              title={s.title}
              img={s.img}
              href={`/shop?cat=${s.slug}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- purana FLAT GRID — fallback (mainCategory attach na ho to) ---------- */
function FlatCategoriesGrid({ cats }: { cats: Cat[] }) {
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
          <CategoryCard
            key={c._id}
            title={c.title}
            img={c.img}
            href={`/shop?cat=${c.slug}`}
          />
        ))}
      </div>
    </section>
  );
}

function CategoriesSection() {
  const [mainCats, setMainCats] = useState<MainCat[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      client.fetch<MainCat[]>(MAIN_CATS_QUERY).catch(() => [] as MainCat[]),
      client.fetch<Cat[]>(CATS_QUERY).catch(() => [] as Cat[]),
    ]).then(([mc, c]) => {
      setMainCats(mc || []);
      setCats(c || []);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <section id="categories" className="mx-auto max-w-6xl px-4 py-10">
        <SectionHead emoji="📂" title="Shop by Category" href="/shop" />
        <SliderSkeleton />
      </section>
    );
  }

  const goodCats = cats.filter(
    (c) => c?.title && c?.slug && !isJunk(norm(c.title))
  );
  if (goodCats.length === 0) return null;

  const goodMains = mainCats.filter(
    (mc) => mc?.title && mc?.slug && !isJunk(norm(mc.title))
  );

  /* ✅ FALLBACK — mainCategory attach hi nahi to flat grid */
  const groups = goodMains
    .map((mc) => ({ main: mc, subs: goodCats.filter((c) => c.mainId === mc._id) }))
    .filter((g) => g.subs.length > 0);

  if (groups.length === 0) {
    return <FlatCategoriesGrid cats={goodCats} />;
  }

  /* attach na hui / dangling mainId wali categories */
  const otherCats = goodCats.filter(
    (c) => !c.mainId || !goodMains.some((mc) => mc._id === c.mainId)
  );

  return (
    <section id="categories" className="py-10">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHead
          emoji="📂"
          title="Shop by Category"
          sub="Main category chuno — uski categories slide me"
          href="/shop"
        />
      </div>

      {groups.map((g, i) => (
        <CategoryGroupRow key={g.main._id} main={g.main} subs={g.subs} alt={i % 2 === 0} />
      ))}

      {otherCats.length > 0 && (
        <CategoryGroupRow
          main={{ _id: "other-cats", title: "Other Categories", slug: "", img: undefined }}
          subs={otherCats}
          alt={groups.length % 2 === 0}
          emoji="🚗"
        />
      )}
    </section>
  );
}

/* ============================================================
   7. VEHICLE SELECTOR
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
   8. CATEGORY PRODUCT ROWS ✅ — SUB-CATEGORIES KE SATH
   - Har category row ke sath uski sub-category chips
   - 4 categories pehle, baqi "View More Categories" pe
   - Har row me 4 products (SHOP WAALA CARD)
============================================================ */
const MAX_CATEGORY_ROWS = 4;   /* pehle kitni categories nazar aayen */
const PRODUCTS_PER_ROW = 4;    /* har category row me kitne products */

function CategoryRow({ parent, alt }: { parent: ParentNode; alt?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollDir = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  const rowProds = parent.prods.slice(0, PRODUCTS_PER_ROW);
  const rowSubs = parent.subs.filter((s) => s.count > 0);

  return (
    <section className={`py-10 ${alt ? "bg-gray-50 dark:bg-[#0D1F30]/60" : ""}`}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-3">
          <SectionHead
            emoji="📂"
            title={parent.name}
            sub={`${parent.prods.length} products`}
            href={`/shop?cat=${parent.slug}`}
          />
          <SliderArrows onPrev={() => scrollDir(-1)} onNext={() => scrollDir(1)} />
        </div>

        {/* ✅ SUB-CATEGORY CHIPS — click → shop me wahi sub khulti hai */}
        {rowSubs.length > 0 && (
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Sub:
            </span>
            {rowSubs.map((s) => (
              <Link key={s.key} href={`/shop?cat=${s.slug}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:bg-[#F5A623] hover:text-white dark:bg-[#13293D] dark:text-gray-300 dark:hover:bg-[#F5A623] dark:hover:text-[#0A1929]"
                title={`${s.name} — ${s.count} products`}>
                {s.name}
                <span className="rounded-full bg-white px-1.5 text-[9px] font-black text-gray-500 dark:bg-[#0A1929]/60 dark:text-gray-400">
                  {s.count}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* ✅ MOBILE: 2-col grid | SM+: slide (swipe + snap) */}
        <div
          ref={ref}
          className="grid grid-cols-2 gap-4 sm:flex sm:snap-x sm:snap-mandatory sm:overflow-x-auto sm:pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {rowProds.map((p) => (
            <div key={p._id} className="sm:w-48 sm:shrink-0 sm:snap-start lg:w-56">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryProductRows() {
  const [tree, setTree] = useState<ParentNode[]>([]);
  const [allProds, setAllProds] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [cats, subDocs, prods] = await Promise.all([
          client.fetch<Cat[]>(CATS_QUERY).catch(() => [] as Cat[]),
          client.fetch<SubDoc[]>(SUBS_QUERY).catch(() => [] as SubDoc[]),
          client
            .fetch<Prod[]>(`*[_type == "product"] | order(_createdAt desc) [0...500] { ${PRODUCT_FIELDS} }`)
            .catch(() => [] as Prod[]),
        ]);
        if (!alive) return;
        setAllProds(prods || []);
        setTree(buildTree(cats || [], subDocs || [], prods || []));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton n={4} h="h-48" />
      </section>
    );
  }

  const rows = tree.filter((p) => p.prods.length > 0);

  /* ✅ Fallback — kisi wajah se tree khali ho to All Products grid */
  if (rows.length === 0) {
    if (allProds.length === 0) return null;
    return (
      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionHead emoji="🛒" title="All Products" sub="Latest used auto parts" href="/shop" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {allProds.slice(0, 8).map((p) => (
            <ProductCard key={p._id} p={p} />
          ))}
        </div>
      </section>
    );
  }

  const visible = showAll ? rows : rows.slice(0, MAX_CATEGORY_ROWS);

  return (
    <div>
      {visible.map((parent, i) => (
        <CategoryRow key={parent.key} parent={parent} alt={i % 2 === 0} />
      ))}

      {/* ✅ VIEW MORE CATEGORIES */}
      {rows.length > MAX_CATEGORY_ROWS && (
        <div className="mx-auto max-w-6xl px-4 pb-6 text-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#F5A623] px-6 py-3 text-sm font-black text-[#F5A623] transition hover:bg-[#F5A623] hover:text-[#0A1929]">
            {showAll ? (
              <>
                Show Less
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </>
            ) : (
              <>
                View More Categories ({rows.length - MAX_CATEGORY_ROWS} more)
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   9. SOCIAL PAGES
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
                  <img src={IG_PROFILE_IMG} alt="AutoBrothers Instagram" className="h-full w-full rounded-full object-cover" />
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
   HOME ✅ v4 — SECTION ORDER:
   Hero → News → Main Categories → New Arrivals → FEATURED
   → Shop by Category → Vehicle → Category Rows → Social
   ✅ Splash overlay — content ke UPAR dikhta hai, block nahi
============================================================ */
export default function HomeContent() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
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

      {/* ✅ Content HAMESHA render — SEO + hydration dono fix */}
      <Hero />
      <NewsSection />
      <MainCategoriesSection />
      <NewArrivals />
      {/* ✅ v4: Featured Products ab New Arrivals ke NEECHE */}
      <FeaturedSlider />
      <CategoriesSection />
      <VehicleSection />
      <CategoryProductRows />
      <SocialPages />
    </div>
  );
}
