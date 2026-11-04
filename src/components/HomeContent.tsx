"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { client } from "../lib/sanityClient";
import SplashScreen from "./animations/splashscreen";
import VehicleSelector from "./VehicleSelector";
import { Car, ChevronRight } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */
type Prod = {
  _id: string; title: string; slug: string;
  price?: string | number; oldPrice?: string | number;
  image?: string; condition?: string; conditionScore?: number;
  mileage?: string; warranty?: number; qualityChecked?: boolean;
  japanImported?: boolean; model?: string; newArrival?: boolean;
  category?: string; catSlug?: string; subCategory?: string; subSlug?: string;
};
type Cat = { _id: string; title: string; slug: string; img?: string };
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

/* ✅ WATERMARK helper — har external image (Sanity/ImgBB) is route se guzar kar
   aati hai, server par "autobrothers.pk" bake hota hai (save karo to bhi sath) */
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

/* ✅ Condition → Score (ProductCard jaisa hi) */
const scoreMap: Record<string, number> = { Good: 8, Average: 6, Bad: 3 };
const getScore = (p: any): number =>
  typeof p?.conditionScore === "number" && p.conditionScore > 0
    ? p.conditionScore
    : (scoreMap[p?.condition] ?? 0);

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
   GROQ — product fields (shared)
============================================================ */
const PRODUCT_FIELDS = `
  _id, title, "slug": slug.current, price, oldPrice, condition, conditionScore,
  mileage, warranty, qualityChecked, japanImported, model, newArrival,
  "image": images[0].asset->url,
  "subCategory": subcategory->title,
  "subSlug": subcategory->slug.current,
  "category": subcategory->parentCategory->title,
  "catSlug": subcategory->parentCategory->slug.current
`;

const CATS_QUERY = `*[_type == "category"] | order(coalesce(order, 9999) asc, title asc) {
  _id, title, "slug": slug.current, "img": image.asset->url
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
   ✅ HYDRATION-SAFE PRODUCT CARD
   - img hamesha render hota hai (conditional <div> swap nahi)
   - wa.me me sahi number
   - Score badge + used trust chips
   - ✅ WATERMARK: image /api/watermark route se
============================================================ */
function ProductCard({ p }: { p: Prod }) {
  const score = getScore(p);
  const scoreColor =
    score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-red-500";

  const imgAlt = `${p.title}${p.condition ? ` — ${p.condition} condition ${score}/10` : ""} used auto part${p.model ? `, fits ${p.model}` : ""} — AutoBrothers Pakistan`;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200/70 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl dark:bg-[#112240] dark:ring-white/[0.06]">

      {/* ✅ img HAMESHA render — hydration safe (src khali toh invisible) */}
      <img
        src={p.image ? wmSrc(p.image, 800, 70) : ""}
        alt={imgAlt}
        loading="lazy"
        width={800}
        height={800}
        className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${p.image ? "" : "hidden"}`}
      />
      {/* Placeholder — img na ho toh (dono sides pe same condition) */}
      {!p.image && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#0D1F30] dark:to-[#13293D]">
          <svg className="h-12 w-12 text-gray-300 dark:text-[#1E3A52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7.5v9a1.5 1.5 0 01-.75 1.3l-6.5 3.75a1.5 1.5 0 01-1.5 0L4.75 17.8A1.5 1.5 0 014 16.5v-9a1.5 1.5 0 01.75-1.3l6.5-3.75a1.5 1.5 0 011.5 0l6.5 3.75A1.5 1.5 0 0120 7.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5L12 12l7.5-4.5M12 21v-9" />
          </svg>
        </div>
      )}

      {/* HOVER OVERLAY */}
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/90 via-black/50 to-black/40 opacity-0 backdrop-blur-[2px] transition-all duration-400 group-hover:opacity-100">

        <div className="flex items-start justify-between p-3">
          {score > 0 && (
            <span className={`rounded-lg px-2 py-1 text-[9px] font-black text-white backdrop-blur-md ${scoreColor}`}>
              {score}/10
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

          {/* ✅ Used trust chips */}
          {(p.mileage || p.warranty || p.qualityChecked || p.japanImported) && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {p.mileage && (
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-bold text-white">🛣 {p.mileage}km</span>
              )}
              {p.warranty && (
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-bold text-white">🛡 {p.warranty}d</span>
              )}
              {p.qualityChecked && (
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-bold text-white">✅ Tested</span>
              )}
              {p.japanImported && (
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-bold text-white">🇯🇵 Japan</span>
              )}
            </div>
          )}

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
                /* ✅ NUMBER — seedha WhatsApp chat */
                window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi! I'm interested in: ${p.title} — Rs ${p.price}`)}`, "_blank");
              }}
              aria-label={`Order ${p.title} on WhatsApp`}
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
   2. NEWS
============================================================ */
type Post = { _id: string; title: string; slug: string; image?: string; date: string; desc?: string };

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
                <div className="overflow-hidden">
                  {/* ✅ img hamesha — hydration safe | ✅ WATERMARK route se */}
                  <img
                    src={p.image ? wmSrc(p.image, 600, 70) : ""}
                    alt={`${p.title} — AutoBrothers car care blog`}
                    loading="lazy"
                    width={600}
                    height={300}
                    className={`h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105 ${p.image ? "" : "hidden"}`}
                  />
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
   3. NEW ARRIVALS
============================================================ */
function NewArrivals() {
  const [prods, setProds] = useState<Prod[]>([]);

  useEffect(() => {
    client.fetch<Prod[]>(
      `*[_type == "product" && newArrival == true] | order(_createdAt desc) [0...8] { ${PRODUCT_FIELDS} }`
    ).then((d) => {
      if (d?.length) { setProds(d); return; }
      return client.fetch<Prod[]>(
        `*[_type == "product"] | order(_createdAt desc) [0...8] { ${PRODUCT_FIELDS} }`
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
   4. CATEGORIES — main category cards
============================================================ */
function CategoriesSection() {
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    client.fetch<Cat[]>(CATS_QUERY).then(setCats).catch(() => {});
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
        {cats.filter((c) => !isJunk((c.title || "").toLowerCase())).map((c) => (
          <Link key={c._id} href={`/shop?cat=${c.slug}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md ring-1 ring-gray-200 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:ring-[#F5A623]/50 dark:ring-[#1E3A52]">

            {c.img ? (
              <img src={wmSrc(c.img, 600, 70)} alt={`Used ${c.title} auto parts — AutoBrothers Pakistan`} loading="lazy"
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
   4.5. VEHICLE SELECTOR
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
   5. CATEGORY PRODUCT ROWS ✅ v3 — SUB-CATEGORIES KE SATH
   - Har main category row ke sath uski sub-category chips
     (chips pe click → shop me wahi sub-category khulti hai)
   - 4 categories pehle, baqi "View More Categories" pe
   - Har row me 4 products
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
          <div className="hidden shrink-0 gap-2 pb-1 sm:flex">
            <button onClick={() => scrollDir(-1)} aria-label="Previous"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 shadow-sm transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:ring-[#1E3A52] dark:hover:bg-[#F5A623]/20 dark:hover:text-[#F5A623]">◀</button>
            <button onClick={() => scrollDir(1)} aria-label="Next"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 shadow-sm transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:ring-[#1E3A52] dark:hover:bg-[#F5A623]/20 dark:hover:text-[#F5A623]">▶</button>
          </div>
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

        <div ref={ref}
          className="grid grid-cols-2 gap-4 sm:flex sm:snap-x sm:snap-mandatory sm:overflow-x-auto sm:pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {rowProds.map((p) => (
            <div key={p._id} className="sm:w-48 sm:shrink-0 sm:snap-start lg:w-56">
              <Link href={`/product/${p.slug}`}>
                <ProductCard p={p} />
              </Link>
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
            <Link key={p._id} href={`/product/${p.slug}`}>
              <ProductCard p={p} />
            </Link>
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
   6. FEATURED SLIDER
============================================================ */
function FeaturedSlider() {
  const ref = useRef<HTMLDivElement>(null);
  const [prods, setProds] = useState<Prod[]>([]);

  useEffect(() => {
    client.fetch<Prod[]>(
      `*[_type == "product" && featured == true] | order(_createdAt desc) [0...20] { ${PRODUCT_FIELDS} }`
    ).then(setProds).catch(() => {});
  }, []);

  const scrollDir = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <section className="bg-gray-50 py-10 dark:bg-[#0D1F30]/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-3">
          <SectionHead emoji="🔥" title="Featured Products" sub="Swipe karo ya arrows dabao" />
          <div className="hidden shrink-0 gap-2 pb-1 sm:flex">
            <button onClick={() => scrollDir(-1)} aria-label="Prev"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 shadow-sm transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:ring-[#1E3A52] dark:hover:bg-[#F5A623]/20 dark:hover:text-[#F5A623]">◀</button>
            <button onClick={() => scrollDir(1)} aria-label="Next"
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
   HOME — ✅ SPLASH overlay, content hamesha render (SEO)
   ✅ Category rows ab SUB-CATEGORIES ke sath:
      category name → sub-chips → 4 products → agli category...
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
      {/* ✅ Splash overlay — content ke UPAR dikhta hai, content block nahi karta */}
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
      <NewArrivals />
      <CategoriesSection />
      <VehicleSection />
      <CategoryProductRows />
      <FeaturedSlider />
      <SocialPages />
    </div>
  );
}
