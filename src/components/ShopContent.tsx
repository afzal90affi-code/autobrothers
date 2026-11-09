"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { client } from "../lib/sanityClient";

/* ============================================================
   TYPES
   ✅ v7: MainCat type + Cat me mainId/mainTitle/mainSlug +
   ParentNode me isMain flag (3-level hierarchy support)
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
  synthetic?: boolean; isMain?: boolean; subs: SubNode[]; prods: Prod[];
};

type Props = {
  initialCat?: string;
  initialQ?: string;
  /* purana shop page agar prods/cats pass karta hai to accept ho jayen (ignore hote hain —
     component ab Sanity se khud fetch karta hai taake subCategory fields zaroor hon) */
  prods?: unknown[];
  cats?: unknown[];
};

/* ============================================================
   CONSTANTS + HELPERS
============================================================ */
const WHATSAPP_NUMBER = "923222806245";
const FB_URL = "https://www.facebook.com/profile.php?id=100064020401353";
const IG_URL = "https://instagram.com/autobrothers.pk";
const IG_PROFILE_IMG = "https://i.ibb.co/84814xg5/b16b-5542697ff3a9c-1296x.webp";

/* ✅ WATERMARK helper — har image /api/watermark route se jayegi */
const wm = (url: string, w: number, q = 70) =>
  `/api/watermark?src=${encodeURIComponent(url)}&w=${w}&q=${q}`;

const norm = (s?: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
const slugify = (s?: string) =>
  norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const titleCase = (s?: string) =>
  (s || "").replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const JUNK = ["test", "delete", "demo", "sample", "dummy", "asdf", "check", "us news"];
const isJunk = (t: string) => JUNK.some((j) => t.includes(j));

/* ============================================================
   ✅ FUZZY CATEGORY MATCH — product ka catSlug aksar category
   slug se exact match nahi hota (slug "throttle" lekin product me
   "throttle body") — isliye slug / category / subCategory sab
   check hote hain. Loose version token-overlap bhi dekhta hai.
============================================================ */
function prodInCat(p: Prod, slug?: string, name?: string): boolean {
  const s = norm(slug);
  const n = norm(name);
  const fields = [norm(p.catSlug), norm(p.category), norm(p.subCategory)];
  const hit = (f: string, t: string) =>
    !!t && (f === t || (t.length >= 4 && f.includes(t)) || (f.length >= 4 && t.includes(f)));
  return fields.some((f) => (f ? hit(f, s) || hit(f, n) : false));
}

const GENERIC = new Set([
  "parts", "part", "auto", "autos", "spare", "spares", "car", "cars",
  "accessories", "accessory", "general", "other", "others", "misc",
  "shop", "store", "pakistan", "autobrothers", "product", "products",
  "item", "items", "the", "and", "for", "with",
]);
const tokensOf = (s?: string) =>
  norm(s).split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !GENERIC.has(t));

function prodInCatLoose(p: Prod, slug?: string, name?: string): boolean {
  if (prodInCat(p, slug, name)) return true;
  const pt = new Set([
    ...tokensOf(p.catSlug), ...tokensOf(p.category), ...tokensOf(p.subCategory),
  ]);
  const ct = [...tokensOf(slug), ...tokensOf(name)];
  return ct.some((c) => pt.has(c));
}

/* ============================================================
   ✅ SORT — newest (date) / price low-high / price high-low
============================================================ */
type SortMode = "newest" | "price-asc" | "price-desc";

const priceNum = (p: Prod) => Number(String(p.price ?? "").replace(/[^0-9]/g, "")) || 0;

const dateMs = (p: Prod) => {
  const t = Date.parse(String(p.createdAt || ""));
  return Number.isNaN(t) ? 0 : t;
};

function sortProds(list: Prod[], mode: SortMode): Prod[] {
  const arr = Array.from(list);
  if (mode === "price-asc") arr.sort((a, b) => priceNum(a) - priceNum(b));
  else if (mode === "price-desc") arr.sort((a, b) => priceNum(b) - priceNum(a));
  else arr.sort((a, b) => dateMs(b) - dateMs(a));
  return arr;
}

/* ============================================================
   ✅ CATEGORY TREE BUILDER — main categories + sub-categories
   (HomeContent wala hi builder — dono files me same logic)
   ✅ v7: mainCats parameter — Main Category docs se group nodes
   bante hain, unke andar attached categories (dropdown/chips) aur
   group ke saare products aggregate hote hain.
============================================================ */
function buildTree(cats: Cat[], subDocs: SubDoc[], prods: Prod[], mainCats: MainCat[]): ParentNode[] {
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

  const findParent = (slug?: string, name?: string): ParentNode | undefined => {
    const s = norm(slug); const n = norm(name);
    if (!s && !n) return undefined;
    for (const v of Array.from(parents.values())) {
      const vs = norm(v.slug); const vn = norm(v.name);
      if (s && (vs === s || vn === s)) return v;
      if (n && (vn === n || vs === n)) return v;
      if (s && vs.length >= 4 && s.length >= 4 && (vs.includes(s) || s.includes(vs))) return v;
      if (n && vn.length >= 4 && n.length >= 4 && (vn.includes(n) || n.includes(vn))) return v;
    }
    return undefined;
  };

  /* ---- ✅ NAYA Step 0a: MAIN CATEGORIES — sab se oper wale groups ---- */
  (mainCats || []).forEach((mc) => {
    if (!mc?.title || !mc?.slug) return;
    if (isJunk(norm(mc.title))) return;
    const node = ensureParent(mc.title, mc.slug, mc.img, mc._id);
    node.isMain = true;
  });

  /* ---- Step 0: Sanity cats classify — kaun parent, kaun kisi aur ki sub ---- */
  const goodCats = (cats || []).filter(
    (c) => c?.title && !isJunk((c.title || "").toLowerCase())
  );
  const subCats: { c: Cat; parentSlug?: string; parentTitle?: string }[] = [];

  goodCats.forEach((c) => {
    /* ✅ NAYA: category kisi MAIN CATEGORY me attached hai —
       main node ke dropdown me add karo (category apna parent node
       bhi banegi taake uske sub-categories pehle jaise hi kaam karen) */
    if (c.mainId) {
      const mNode = Array.from(parents.values()).find((v) => v._id && v._id === c.mainId);
      if (mNode) {
        const sKey = norm(c.title);
        if (!mNode.subs.find((x) => x.key === sKey)) {
          mNode.subs.push({
            key: sKey,
            name: c.title,
            slug: c.slug || slugify(c.title),
            img: c.img,
            count: 0,
          });
        }
      }
    }

    const t = norm(c.title);
    let subOf: { parentSlug?: string; parentTitle?: string } | null = null;
    /* mainId wali categories ko heuristic se classify na karo —
       wo khud parent node banengi (explicit link > guess) */
    if (!c.mainId) {
      for (const p of prods || []) {
        const s = norm(p.subCategory);
        if (!s) continue;
        const same = s === t || (t.length >= 4 && s.includes(t)) || (s.length >= 4 && t.includes(s));
        if (!same) continue;
        const pCat = norm(p.category);
        const selfCat =
          pCat && (pCat === t || norm(p.catSlug) === norm(c.slug) || pCat.includes(t) || t.includes(pCat));
        if (!selfCat) { subOf = { parentSlug: p.catSlug, parentTitle: p.category }; break; }
      }
    }
    if (subOf) subCats.push({ c, parentSlug: subOf.parentSlug, parentTitle: subOf.parentTitle });
    else ensureParent(c.title, c.slug || slugify(c.title), c.img, c._id);
  });

  /* ---- Step 1: Sanity subcategory docs — parent ke sath attach ---- */
  (subDocs || []).forEach((sd) => {
    if (!sd?.title) return;
    let parent =
      (sd.parentId && Array.from(parents.values()).find((v) => v._id && v._id === sd.parentId)) ||
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

  /* ---- Step 3: products — parent group + sub counts ---- */
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

  /* ---- ✅ NAYA Step 4: MAIN groups me group ke saare products bharo ---- */
  Array.from(parents.values())
    .filter((v) => v.isMain)
    .forEach((m) => {
      const childSlugs = m.subs.map((s) => norm(s.slug));
      const childKeys = m.subs.map((s) => s.key);
      const agg = (prods || []).filter((p) => {
        const cs = norm(p.catSlug);
        const cn = norm(p.category);
        return (!!cs && childSlugs.includes(cs)) || (!!cn && childKeys.includes(cn));
      });
      const have = new Set(m.prods.map((p) => p._id));
      m.prods = [...m.prods, ...agg.filter((p) => !have.has(p._id))];
      m.subs.forEach((s) => {
        s.count = m.prods.filter(
          (p) => norm(p.catSlug) === norm(s.slug) || norm(p.category) === s.key
        ).length;
      });
    });

  /* finalize */
  const arr = Array.from(parents.values());
  arr.forEach((v) => {
    if (!v.img && v.prods.length && v.prods[0].image) v.img = v.prods[0].image;
    v.subs.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  });
  const real = arr.filter((v) => !v.synthetic);
  const syn = arr.filter((v) => v.synthetic).sort((a, b) => b.prods.length - a.prods.length);
  return [...real, ...syn];
}

/* ============================================================
   GROQ — ek hi query me sab kuch (categories + subcategories + products)
   ✅ "createdAt": _createdAt — date sort ke liye
   ✅ v7: mainCats query + cats me mainId/mainTitle/mainSlug
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

const SHOP_QUERY = `{
  "mainCats": *[_type == "mainCategory"] | order(coalesce(order, 9999) asc, title asc) {
    _id, title, "slug": slug.current, "img": image.asset->url
  },
  "cats": *[_type == "category"] | order(coalesce(order, 9999) asc, title asc) {
    _id, title, "slug": slug.current, "img": image.asset->url,
    "mainId": mainCategory->_id,
    "mainTitle": mainCategory->title,
    "mainSlug": mainCategory->slug.current
  },
  "subs": *[_type == "subcategory"] | order(title asc) {
    _id, title, "slug": slug.current, "img": image.asset->url,
    "parentId": parentCategory->_id,
    "parentTitle": parentCategory->title,
    "parentSlug": parentCategory->slug.current
  },
  "prods": *[_type == "product"] | order(_createdAt desc) [0...500] { ${PRODUCT_FIELDS} }
}`;

/* ============================================================
   ✅ PRODUCT CARD — NO NESTED LINKS (hydration safe)
============================================================ */
function ProductCard({ p }: { p: Prod }) {
  const oldPriceNum = p.oldPrice ? Number(String(p.oldPrice).replace(/[^0-9]/g, "")) : 0;
  const newPriceNum = Number(String(p.price).replace(/[^0-9]/g, "")) || 0;
  const discount = oldPriceNum > newPriceNum ? Math.round(((oldPriceNum - newPriceNum) / oldPriceNum) * 100) : 0;

  const imgAlt = `${p.title}${p.condition ? ` — ${p.condition} condition` : ""} used auto part${p.model ? `, fits ${p.model}` : ""} — AutoBrothers Pakistan`;

  /* ✅ WATERMARK — image seedha nahi, watermark route se */
  const imgSrc = p.image ? wm(p.image, 600, 70) : null;
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

/* ============================================================
   ✅ CATEGORY SLIDER SECTION — New Arrivals wala slide system
   Har category section: heading + count + arrows + View All
   Desktop: left/right arrows | Mobile: swipe (snap scroll)
============================================================ */
function SliderSection({ title, items, viewAllSlug, onOpen }: {
  title: string; items: Prod[]; viewAllSlug?: string; onOpen?: (slug: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-gray-200 pb-2 dark:border-[#1E3A52]">
        <div>
          <h3 className="text-lg font-black text-slate-900 sm:text-xl dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{items.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden gap-2 sm:flex">
            <button onClick={() => scroll(-1)} aria-label="Previous"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:text-gray-400 dark:ring-[#1E3A52] dark:hover:text-[#F5A623]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => scroll(1)} aria-label="Next"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:text-gray-400 dark:ring-[#1E3A52] dark:hover:text-[#F5A623]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {viewAllSlug && onOpen && (
            <button
              onClick={() => onOpen(viewAllSlug)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:border-[#F5A623] hover:bg-[#F5A623] hover:text-white dark:border-[#1E3A52] dark:bg-[#13293D] dark:text-gray-300 dark:hover:text-white"
            >
              View All
            </button>
          )}
        </div>
      </div>

      <div
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => (
          <div key={p._id} className="w-48 shrink-0 snap-start sm:w-56">
            <ProductCard p={p} />
          </div>
        ))}
      </div>
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
   SHOP CONTENT ✅ v11 — URL WATCHER (secondary navbar fix)
   - ✅ v11: ?cat= / ?q= URL changes ab LIVE track hote hain.
     Pehle ?cat= sirf FIRST LOAD pe parha jata tha — isi liye shop
     page pe ho aur secondary navbar se doosri category click karo
     to page nahi badalta tha. Ab har URL change pe page TURANT us
     category pe khulta hai. openCat ab URL bhi sync karta hai
     (replaceState — navigation nahi, instant).
   - ✅ v10: andar wali sticky CATEGORY NAVBAR (All Parts + NavItem
     dropdowns) REMOVE — ab sirf global Navbar ka SecondaryNav hai
     (jo isi style me banaya gaya hai). Double navbar khatam.
   - ✅ v9: main page ki attached categories ab SLIDER STYLE me —
     arrows (desktop) + swipe (mobile), New Arrivals jaisa hi system.
   - ✅ v8: Main Category card click → USKA APNA PAGE khulta hai:
     New Arrivals / Hot Deals / Main Categories section hidden.
     SIRF wo categories nazar aati hain jo us main category me
     attached hain. Toggle: Categories | All Products.
   - ✅ v7: "Main Categories" section — New Arrivals + Hot Deals
     ke NICHE, Products se UPAR. Badi cards (image + naam + count).
   - ✅ v6: poora page structure (hero + H1) HAMESHA server se
     render hota hai. Sirf product cards loading me pulse karte hain.
   - Baqi sab: sort dropdown, category-wise sliders, sub-chips,
     brand filter, social pages.
============================================================ */
export default function ShopContent({ initialCat = "", initialQ = "" }: Props) {
  const [active, setActive] = useState(initialCat);
  const [query, setQuery] = useState(initialQ);
  const [brandFilter, setBrandFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  /* ✅ v8: MAIN CATEGORY PAGE — "cats" = sirf attached categories ka
     grid | "prods" = group ke saare products. Default: categories. */
  const [mainTab, setMainTab] = useState<"cats" | "prods">("cats");
  const [mainCats, setMainCats] = useState<MainCat[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [subDocs, setSubDocs] = useState<SubDoc[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const featuredRef = useRef<HTMLDivElement>(null);
  const arrivalsRef = useRef<HTMLDivElement>(null);
  const mainCatsRef = useRef<HTMLDivElement>(null); /* ✅ v9: main page categories slider */

  /* ✅ SELF FETCH — mainCats + cats + subs + products ek hi query me */
  useEffect(() => {
    let alive = true;
    client
      .fetch<{ mainCats: MainCat[]; cats: Cat[]; subs: SubDoc[]; prods: Prod[] }>(SHOP_QUERY)
      .then((d) => {
        if (!alive) return;
        setMainCats(d?.mainCats || []);
        setCats(d?.cats || []);
        setSubDocs(d?.subs || []);
        setProds(d?.prods || []);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  /* ✅ v11: URL WATCHER — secondary navbar se category click karo to
     URL (?cat= / ?q=) badalta hai lekin component re-mount nahi hota
     (same /shop route). Pehle ?cat= sirf mount pe liya jata tha —
     isi liye navbar se category click karne par page nahi badalta tha.
     Ab: URL change detect hote hi page turant us category pe khulta hai.
     - openCat (page ke andar clicks) URL replaceState se sync karta hai
     - navbar / koi bhi Link navigation → watcher pakar leta hai
     - 250ms poll + popstate — Suspense/useSearchParams ki zaroorat nahi */
  const urlRef = useRef<{ cat: string; q: string }>({ cat: initialCat || "", q: initialQ || "" });
  useEffect(() => {
    const readUrl = () => {
      try {
        const sp = new URLSearchParams(window.location.search);
        const c = sp.get("cat") || "";
        const q = sp.get("q") || "";
        if (c === urlRef.current.cat && q === urlRef.current.q) return;
        urlRef.current = { cat: c, q };
        setActive(c);
        setQuery(q);
        setMainTab("cats");
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* noop */ }
      } catch { /* noop */ }
    };
    readUrl();
    const t = window.setInterval(readUrl, 250);
    window.addEventListener("popstate", readUrl);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("popstate", readUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ✅ TREE — main groups + parents + subs */
  const tree = useMemo(() => buildTree(cats, subDocs, prods, mainCats), [cats, subDocs, prods, mainCats]);

  /* ✅ NAYA: MAIN category nodes — section ke cards ke liye */
  const mainNodes = useMemo(() => tree.filter((n) => n.isMain), [tree]);

  /* slug → node index (parent ya sub dono) */
  const index = useMemo(() => {
    const m = new Map<string, { kind: "parent" | "sub"; parent: ParentNode; sub?: SubNode }>();
    tree.forEach((p) => {
      const k = norm(p.slug);
      if (k && !m.has(k)) m.set(k, { kind: "parent", parent: p });
    });
    tree.forEach((p) =>
      p.subs.forEach((s) => {
        const k = norm(s.slug);
        if (k && !m.has(k)) m.set(k, { kind: "sub", parent: p, sub: s });
      })
    );
    return m;
  }, [tree]);

  const found = useMemo(
    () => (active ? index.get(norm(active)) : undefined),
    [active, index]
  );
  const activeParent = found?.parent;
  const activeSub = found?.kind === "sub" ? found.sub : undefined;
  const activeName = found ? (found.kind === "parent" ? found.parent.name : found.sub!.name) : "";
  const activeImg = found ? (found.kind === "parent" ? found.parent.img : found.sub!.img) : undefined;

  /* ✅ v8: MAIN CATEGORY PAGE — jab koi MAIN category open ho to uska
     apna page banta hai: SIRF wo categories nazar aati hain jo usme
     attached hain (buildTree inhe m.subs me rakhta hai). Search ya
     brand filter chalu ho to automatically products view par switch. */
  const isMainOpen = !!found && found.kind === "parent" && found.parent.isMain;
  const mainCatsTab = isMainOpen && mainTab === "cats" && !query.trim() && !brandFilter;

  /* Available brands */
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    prods.forEach((p) => { if (p.brand) set.add(String(p.brand)); });
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

  /* ✅ FILTERING — strict fuzzy pehle, khali nikle to loose token match */
  const filtered = useMemo(() => {
    let list = prods;
    if (found) {
      if (found.kind === "parent" && found.parent.isMain) {
        /* ✅ NAYA: MAIN CATEGORY — group ke saare products
           (buildTree ne pehle hi aggregate kar rakhe hain) */
        list = found.parent.prods;
      } else {
        const slug = found.kind === "parent" ? found.parent.slug : found.sub!.slug;
        const name = found.kind === "parent" ? found.parent.name : found.sub!.name;
        let m = prods.filter((p) => prodInCat(p, slug, name));
        if (m.length === 0) m = prods.filter((p) => prodInCatLoose(p, slug, name));
        list = m;
      }
    }
    const q = query.trim().toLowerCase();
    if (q) {
      const hay = (x: unknown) => (typeof x === "string" ? x.toLowerCase() : "");
      list = list.filter((p) =>
        [p.title, p.partNumber, p.brand, p.model, p.category, p.subCategory, p.description].some(
          (f) => hay(f).includes(q)
        )
      );
    }
    if (brandFilter) list = list.filter((p) => String(p.brand || "") === brandFilter);
    return list;
  }, [prods, found, query, brandFilter]);

  /* ✅ SORTED — dropdown ke mutabiq */
  const sortedFiltered = useMemo(() => sortProds(filtered, sortBy), [filtered, sortBy]);

  /* ✅ CATEGORY-WISE SECTIONS — All view ke liye (har category ka apna slider)
     ✅ v7: MAIN groups yahan nahi — unka apna section upar hai */
  const groupedSections = useMemo(
    () =>
      tree
        .map((node) => ({ node, items: sortProds(node.prods, sortBy) }))
        .filter((s) => s.items.length > 0 && !s.node.isMain),
    [tree, sortBy]
  );

  /* Jis product ki koi category nahi bani — "Other Parts" me jayega */
  const otherItems = useMemo(() => {
    const inTree = new Set<string>();
    tree.forEach((n) => n.prods.forEach((p) => inTree.add(p._id)));
    return sortProds(
      prods.filter((p) => !inTree.has(p._id)),
      sortBy
    );
  }, [tree, prods, sortBy]);

  /* Category + search + brand — kuch bhi active ho to flat grid, warna grouped */
  const groupedView = !active && !query.trim() && !brandFilter;

  /* ✅ Kabhi khali na khule — suggested products fallback */
  const suggested = useMemo(() => prods.slice(0, 8), [prods]);

  const openCat = (slug: string) => {
    setActive(slug);
    setMainTab("cats"); /* ✅ v8: har naye open pe categories view default */
    /* ✅ v11: URL bhi sync — page ke andar clicks (chips/cards) se URL
       aur navbar ka active state hamesha match rahen. replaceState =
       navigation nahi hoti, instant update, Next 14.1+ official pattern. */
    try {
      window.history.replaceState(
        window.history.state,
        "",
        slug ? `/shop?cat=${encodeURIComponent(slug)}` : "/shop"
      );
    } catch { /* noop */ }
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* noop */ }
  };

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: number) =>
    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  const chipCls = (on: boolean) =>
    `rounded-full px-3 py-1 text-[11px] font-bold transition ${
      on
        ? "bg-[#F5A623] text-white shadow-md"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#1E3A52] dark:text-gray-400 dark:hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A1929]">

      {/* ✅ v10: andar wali CATEGORY NAVBAR hata di — ab upar global
          Navbar ka SecondaryNav (isi style me) ye kaam karta hai */}

      {/* ===== 1. HERO BANNER — ✅ v6: ye H1 ab hamesha server HTML me jata hai ===== */}
      <section className="relative overflow-hidden">
        {activeImg && (
          <img src={wm(activeImg, 1200, 70)} alt={`${activeName} used auto parts — AutoBrothers Pakistan`}
            className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className={`absolute inset-0 ${
          activeImg
            ? "bg-gradient-to-r from-white/90 via-white/70 to-transparent dark:from-[#0A1929]/95 dark:via-[#0A1929]/70"
            : "bg-gradient-to-r from-white via-amber-50/60 to-white dark:from-[#0A1929] dark:via-[#13293D] dark:to-[#0A1929]"
        }`} />

        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-20">
          {/* ✅ SUB pe breadcrumb */}
          {found?.kind === "sub" && activeParent && (
            <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {activeParent.name} <span className="mx-1 text-[#F5A623]">/</span> {activeName}
            </p>
          )}
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:bg-[#F5A623]/15 dark:text-[#F5A623]">
            Auto Parts Shop
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-5xl dark:text-white">
            {activeName ? (
              <>USED <span className="text-[#F5A623]">{activeName.toUpperCase()}</span></>
            ) : (
              <>SHOP <span className="text-[#F5A623]">USED AUTO PARTS</span></>
            )}
          </h1>
          <p className="mt-3 max-w-md text-sm text-gray-600 sm:text-base dark:text-gray-300">
            {activeName
              ? `Quality checked used ${activeName.toLowerCase()} — Japan imported, tested & warranted. All Pakistan delivery.`
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

      {/* ===== 1.5 SUB-CATEGORY CHIPS — jab koi category/sub/main active ho =====
          ✅ v8: MAIN page ke categories view me chips hidden — wahan badi
          category cards hain, chips sirf products view me dikhte hain */}
      {activeParent && activeParent.subs.length > 0 && !mainCatsTab && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 dark:border-[#1E3A52] dark:bg-[#112240]">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              📂 {activeParent.name} — Sub-categories:
            </span>
            <button onClick={() => openCat(activeParent.slug)} className={chipCls(!activeSub)}>
              All {activeParent.name}
            </button>
            {activeParent.subs.map((s) => (
              <button key={s.key} onClick={() => openCat(s.slug)} className={chipCls(active === s.slug)}>
                {s.name}
                <span className={`ml-1.5 text-[9px] font-black ${active === s.slug ? "text-white/80" : "text-gray-400"}`}>
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== 1.6 BRAND FILTER BAR ===== */}
      {availableBrands.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 dark:border-[#1E3A52] dark:bg-[#112240]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">
              🏷️ Brand:
            </span>
            <button
              onClick={() => setBrandFilter("")}
              className={chipCls(!brandFilter)}
            >
              All Brands
            </button>
            {availableBrands.map((b) => (
              <button
                key={b}
                onClick={() => setBrandFilter(brandFilter === b ? "" : b)}
                className={chipCls(brandFilter === b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== 2. NEW ARRIVALS — ✅ v8: MAIN page pe hidden (uska apna page hai) ===== */}
      {newArrivals.length > 0 && !isMainOpen && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <SectionHead tag="Latest" title="New Arrivals" showArrows
            onPrev={() => scroll(arrivalsRef, -1)} onNext={() => scroll(arrivalsRef, 1)} />
          <div ref={arrivalsRef}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {newArrivals.map((p) => (
              <div key={p._id} className="w-48 shrink-0 snap-start sm:w-56">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== 3. FEATURED SLIDER — ✅ v8: MAIN page pe hidden ===== */}
      {featured.length > 0 && !isMainOpen && (
        <section className="bg-white py-8 dark:bg-[#0D1F30]/60">
          <div className="mx-auto max-w-6xl px-4">
            <SectionHead tag="Featured" title="Hot Deals" showArrows
              onPrev={() => scroll(featuredRef, -1)} onNext={() => scroll(featuredRef, 1)} />
            <div ref={featuredRef}
              className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {featured.map((p) => (
                <div key={p._id} className="w-48 shrink-0 snap-start sm:w-56">
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 3.5 ✅ MAIN CATEGORIES — New Arrivals + Hot Deals ke NICHE =====
          ✅ v8: jab khud koi main category open ho to ye section hidden —
          warna page ke andar wahi section dobara nazar aata */}
      {mainNodes.length > 0 && !isMainOpen && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <SectionHead tag="Categories" title="Main Categories" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {mainNodes.map((m) => (
              <button
                key={m.key}
                onClick={() => openCat(m.slug)}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all duration-300 hover:border-[#F5A623] hover:shadow-lg dark:border-[#1E3A52] dark:bg-[#112240]"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-[#0D1F30]">
                  {m.img ? (
                    <img
                      src={wm(m.img, 600, 70)}
                      alt={`${m.name} — used auto parts Pakistan`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#13293D] to-[#0A1929]">
                      <span className="text-4xl font-black text-[#F5A623]">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-3 dark:border-[#1E3A52]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900 transition group-hover:text-[#F5A623] dark:text-white">
                      {m.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {m.prods.length > 0 ? `${m.prods.length} products` : "Coming soon"}
                    </p>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[#F5A623] transition group-hover:bg-[#F5A623] group-hover:text-white dark:bg-[#F5A623]/10">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ===== 4. PRODUCTS — SORT DROPDOWN + CATEGORY-WISE SLIDERS ===== */}
      <section id="products" className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            {/* ✅ v8: MAIN page pe breadcrumb — wapis All Parts pe jao */}
            {isMainOpen && (
              <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <button onClick={() => openCat("")}
                  className="font-bold text-[#F5A623] hover:underline">
                  Shop
                </button>
                <span>/</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{activeName}</span>
              </p>
            )}
            {/* ✅ SUB pe breadcrumb */}
            {found?.kind === "sub" && activeParent && (
              <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <button onClick={() => openCat(activeParent.slug)}
                  className="font-bold text-[#F5A623] hover:underline">
                  {activeParent.name}
                </button>
                <span>/</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{activeName}</span>
              </p>
            )}
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl dark:text-white">
              {activeName || "All Products"}
              {brandFilter && <span className="text-[#F5A623]"> — {brandFilter}</span>}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {loading
                ? "Loading products…"
                : mainCatsTab
                ? `${activeParent?.subs.length || 0} categories — card pe click karo`
                : <>{query ? `"${query}" — ` : ""}{filtered.length} products</>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ SORT DROPDOWN — date / price low-high / price high-low
                ✅ v8: categories view me sort ki zaroorat nahi */}
            {!mainCatsTab && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortMode)}
                aria-label="Sort products"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none transition focus:border-[#F5A623] dark:border-[#1E3A52] dark:bg-[#13293D] dark:text-gray-300"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price-asc">Sort: Price — Low to High</option>
                <option value="price-desc">Sort: Price — High to Low</option>
              </select>
            )}

            {(active || query || brandFilter) && (
              <button onClick={() => { openCat(""); setQuery(""); setBrandFilter(""); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-[#1E3A52] dark:bg-[#13293D] dark:text-gray-300 dark:hover:bg-[#112240]">
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ✅ v8: MAIN CATEGORY PAGE — Categories / All Products toggle */}
        {isMainOpen && !loading && (
          <div className="mb-6 inline-flex overflow-hidden rounded-xl border border-gray-200 bg-white p-1 dark:border-[#1E3A52] dark:bg-[#112240]">
            <button
              onClick={() => setMainTab("cats")}
              className={`rounded-lg px-4 py-2 text-xs font-black transition ${
                mainCatsTab
                  ? "bg-[#F5A623] text-white shadow"
                  : "text-gray-600 hover:text-[#F5A623] dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              📂 Categories ({activeParent?.subs.length || 0})
            </button>
            <button
              onClick={() => setMainTab("prods")}
              className={`rounded-lg px-4 py-2 text-xs font-black transition ${
                !mainCatsTab
                  ? "bg-[#F5A623] text-white shadow"
                  : "text-gray-600 hover:text-[#F5A623] dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              🛒 All Products ({activeParent?.prods.length || 0})
            </button>
          </div>
        )}

        {loading ? (
          /* ✅ v6: loading me bhi page ka structure server se aata hai —
             sirf cards pulse karte hain (pehle POORA page skeleton tha) */
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#13293D]" />
            ))}
          </div>
        ) : mainCatsTab ? (
          /* ============================================================
             ✅ v8: MAIN CATEGORY PAGE — SIRF wo categories nazar aati hain
             jo is main category me ATTACHED hain (Sanity me category ke
             andar Main Category field select kiya gaya ho).
             Card click → us category ke products khulte hain.
             ============================================================ */
          (activeParent?.subs.length ?? 0) === 0 ? (
            <div className="rounded-2xl bg-white py-14 text-center ring-1 ring-gray-100 dark:bg-[#112240] dark:ring-[#1E3A52]">
              <p className="text-sm font-bold text-slate-700 dark:text-white">
                Is main category me abhi koi category attach nahi hui
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Sanity me category kholo → "Main Category" field me ye select karo → Publish.
              </p>
              <button
                onClick={() => setMainTab("prods")}
                className="mt-5 rounded-xl bg-[#F5A623] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#D4911E]"
              >
                Saare Products Dekho
              </button>
            </div>
          ) : (
            <div>
              {/* ✅ v9: Slider header — arrows (desktop) */}
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Category card pe click karo — uske products khulenge
                </p>
                <div className="hidden gap-2 sm:flex">
                  <button onClick={() => scroll(mainCatsRef, -1)} aria-label="Previous"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:text-gray-400 dark:ring-[#1E3A52] dark:hover:text-[#F5A623]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => scroll(mainCatsRef, 1)} aria-label="Next"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:text-gray-400 dark:ring-[#1E3A52] dark:hover:text-[#F5A623]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {/* ✅ v9: Categories SLIDER — swipe (mobile) + snap */}
              <div
                ref={mainCatsRef}
                className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {(activeParent?.subs || []).map((s) => (
                  <div key={s.key} className="w-56 shrink-0 snap-start sm:w-64">
                    <button
                      onClick={() => openCat(s.slug)}
                      className="group block h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all duration-300 hover:border-[#F5A623] hover:shadow-lg dark:border-[#1E3A52] dark:bg-[#112240]"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-[#0D1F30]">
                        {s.img ? (
                          <img
                            src={wm(s.img, 600, 70)}
                            alt={`${s.name} — used auto parts Pakistan`}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#13293D] to-[#0A1929]">
                            <span className="text-4xl font-black text-[#F5A623]">
                              {s.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-3 dark:border-[#1E3A52]">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900 transition group-hover:text-[#F5A623] dark:text-white">
                            {s.name}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {s.count > 0 ? `${s.count} products` : "View parts"}
                          </p>
                        </div>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[#F5A623] transition group-hover:bg-[#F5A623] group-hover:text-white dark:bg-[#F5A623]/10">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : filtered.length === 0 ? (
          <>
            <div className="rounded-2xl bg-white py-14 text-center ring-1 ring-gray-100 dark:bg-[#112240] dark:ring-[#1E3A52]">
              <p className="text-sm font-bold text-slate-700 dark:text-white">Koi product nahi mila</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Doosri category ya brand try karo, ya search clear karo.</p>
            </div>

            {/* ✅ Suggested — page kabhi khali na lage */}
            {suggested.length > 0 && (
              <div className="mt-8">
                <SectionHead tag="Try These" title="Aapko Ye Pasand Aayenge" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {suggested.map((p) => (
                    <ProductCard key={p._id} p={p} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : groupedView ? (
          /* ✅ ALL VIEW — har category ka apna slider (Main groups chhod kar) */
          <>
            {groupedSections.map(({ node, items }) => (
              <SliderSection
                key={node.key}
                title={node.name}
                items={items}
                viewAllSlug={node.slug}
                onOpen={openCat}
              />
            ))}
            {otherItems.length > 0 && (
              <SliderSection title="Other Parts" items={otherItems} />
            )}
          </>
        ) : (
          /* ✅ FILTERED VIEW — flat grid (sort dropdown ke sath) */
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sortedFiltered.map((p) => (
              <ProductCard key={p._id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* ===== 5. SOCIAL PAGES ===== */}
      <SocialPages />
    </div>
  );
}
