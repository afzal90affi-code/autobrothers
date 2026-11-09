"use client";

import { useRef, type RefObject } from "react";
import Link from "next/link";

/* ===== Types (yehi exports Navbar mein chahiye) ===== */
export type NavSection = "shop" | "blog" | "cars";
export type NavCat = {
  _id: string; title: string; slug: string;
  /* category jis MAIN CATEGORY me attached hai (Navbar query se) */
  mainId?: string;
  mainTitle?: string;
  mainSlug?: string;
};
export type NavMainCat = { _id: string; title: string; slug: string };

type Props = {
  section: NavSection;
  cats: NavCat[];
  activeCat: string | null;
  /* mainCategory docs (Navbar se) — na do to cats se derive honge */
  mainCats?: NavMainCat[];
};

/* ============================================================
   ✅ v5 — DONO ROWS SLIDE STYLE (New Arrivals wala slide system)
   ROW 1 (hamesha visible): [All Parts] + MAIN CATEGORIES + directs
     → horizontal SLIDE: swipe (mobile) + arrows (desktop)
   ROW 2 (ROW 1 ke NICHE, sirf jab koi main OPEN ho):
     📂 {main}: [All {main}] [child]... → same slide system
   - koi main open nahi → ROW 2 bilkul hidden
   - style wahi ShopContent navbar style: white glass bar, text
     links, active pe amber + 2px gradient underline, separators
   - scrollbar hidden, desktop pe left/right arrow buttons,
     mobile pe seedha swipe
   - blog / cars: Row 1 ke andar hi slide (purana chip style)
   Props contract SAME hai — Navbar file me koi change nahi.
============================================================ */

/* ---------- amber gradient underline (ShopContent NavItem style) ---------- */
function Underline({ on }: { on: boolean }) {
  return (
    <span
      className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] transition-transform duration-300 ${
        on ? "scale-x-100" : "scale-x-0"
      }`}
    />
  );
}

/* ---------- items ke beech thin separator (ShopContent style) ---------- */
function Sep() {
  return (
    <span
      className="mx-3 h-4 w-px shrink-0 bg-gray-300 dark:bg-[#1E3A52]"
      aria-hidden="true"
    />
  );
}

/* ---------- chevron — jis main ki attached categories hain ---------- */
function Chevron() {
  return (
    <svg
      className="ml-1 inline h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ---------- SLIDE ARROW — site ke slider wala style (navbar size) ---------- */
function ArrowBtn({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === -1 ? "Previous" : "Next"}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-amber-50 hover:text-[#F5A623] dark:bg-[#112240] dark:text-gray-400 dark:ring-[#1E3A52] dark:hover:text-[#F5A623]"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={dir === -1 ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
}

/* ---------- ROW 1: text-link (ShopContent navbar ka exact style) ---------- */
const linkCls = (active: boolean) =>
  `relative shrink-0 whitespace-nowrap px-1 py-2 text-sm font-semibold tracking-wide transition-colors duration-300 ${
    active
      ? "text-[#F5A623]"
      : "text-gray-700 hover:text-[#F5A623] dark:text-gray-300 dark:hover:text-white"
  }`;

/* ---------- ROW 2: thora chhota text-link (niche wali row) ---------- */
const subLinkCls = (active: boolean) =>
  `relative shrink-0 whitespace-nowrap px-1 py-1.5 text-[13px] font-semibold tracking-wide transition-colors duration-300 ${
    active
      ? "text-[#F5A623]"
      : "text-gray-600 hover:text-[#F5A623] dark:text-gray-400 dark:hover:text-white"
  }`;

/* ---------- BLOG: serif magazine underline ---------- */
const blogChip = (active: boolean) =>
  `group relative shrink-0 whitespace-nowrap py-3 text-sm font-serif tracking-wide transition-colors ${
    active
      ? "text-accent-dim dark:text-accent"
      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
  }`;

/* ---------- CARS: bold outlined brand buttons ---------- */
const carChip = (active: boolean) =>
  `shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
    active
      ? "border-accent bg-accent/15 text-accent-dim dark:text-accent shadow-sm"
      : "border-gray-200 dark:border-navy-border text-slate-500 dark:text-slate-300 hover:border-accent/60 hover:text-accent-dim dark:hover:text-accent"
  }`;

export default function SecondaryNav({
  section,
  cats,
  activeCat,
  mainCats: mainCatsProp = [],
}: Props) {
  /* ✅ slide refs — dono rows ka apna scroll area */
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const slide = (ref: RefObject<HTMLDivElement | null>, dir: number) =>
    ref.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  /* ✅ shop ka base /shop hai (site ke routes ke mutabiq) */
  const base = section === "blog" ? "/blog" : section === "cars" ? "/new-cars" : "/shop";
  const param = section === "cars" ? "brand" : "cat";
  const allLabel =
    section === "cars" ? "All Brands" : section === "blog" ? "All Posts" : "All Parts";
  const isShop = section === "shop";

  /* mains: pehle prop se, warna cats ke mainSlug se derive */
  let mains: NavMainCat[] = [];
  if (mainCatsProp.length > 0) {
    mains = mainCatsProp.filter((m) => m?.title && m?.slug);
  } else if (isShop) {
    const seen = new Set<string>();
    cats.forEach((c) => {
      if (c.mainId && c.mainSlug && !seen.has(c.mainSlug)) {
        seen.add(c.mainSlug);
        mains.push({ _id: c.mainId, title: c.mainTitle || c.mainSlug, slug: c.mainSlug });
      }
    });
  }

  /* sirf wo mains jinke paas ACTUALLY attached cats hain */
  mains = mains.filter((m) =>
    cats.some((c) => c.mainId === m._id || c.mainSlug === m.slug)
  );

  /* direct categories — kisi main me attached NAHI (brand-type waghera).
     In me attached hone ke bawajood mains list me na aayen wo bhi cover. */
  const directCats = isShop
    ? cats.filter(
        (c) => !mains.some((m) => c.mainId === m._id || c.mainSlug === m.slug)
      )
    : [];

  /* kaunsi main OPEN hai? — main khud active YA uski koi child active */
  const openMain = isShop
    ? mains.find(
        (m) =>
          m.slug === activeCat ||
          cats.some(
            (c) => c.slug === activeCat && (c.mainId === m._id || c.mainSlug === m.slug)
          )
      )
    : undefined;

  /* ✅ open main ki attached categories — ROW 2 me SIRF yehi */
  const openChildren = openMain
    ? cats.filter((c) => c.mainId === openMain._id || c.mainSlug === openMain.slug)
    : [];

  return (
    <div className="border-b border-gray-200 bg-white/95 backdrop-blur dark:border-[#1E3A52] dark:bg-[#0A1929]/95">

      {/* ============ ROW 1 — SLIDE: All Parts + MAIN CATEGORIES ============
          Hamesha visible. Horizontal swipe (mobile) + arrows (desktop). */}
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <div
          ref={row1Ref}
          className={`flex flex-1 items-center overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            section === "blog" ? "gap-6" : section === "cars" ? "gap-2" : ""
          }`}
        >
          <Link
            href={base}
            className={isShop ? linkCls(!activeCat) : section === "blog" ? blogChip(!activeCat) : carChip(!activeCat)}
          >
            {allLabel}
            {isShop && <Underline on={!activeCat} />}
            {section === "blog" && (
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-all ${
                  !activeCat ? "bg-accent" : "bg-transparent group-hover:bg-accent/40"
                }`}
              />
            )}
          </Link>

          {/* ✅ MAIN CATEGORIES — usi jagah jahan pehle categories thin.
              Uski koi child khuli ho to wo main bhi amber underline. */}
          {isShop &&
            mains.map((m) => {
              const childOpen = cats.some(
                (c) =>
                  c.slug === activeCat &&
                  (c.mainId === m._id || c.mainSlug === m.slug)
              );
              const active = m.slug === activeCat || childOpen;
              return (
                <span key={`main-${m._id}`} className="flex items-center">
                  <Sep />
                  <Link
                    href={`${base}?${param}=${m.slug}`}
                    className={linkCls(active)}
                    title={m.title}
                  >
                    {m.title}
                    <Chevron />
                    <Underline on={active} />
                  </Link>
                </span>
              );
            })}

          {/* direct categories — jinko kisi main me attach nahi kiya */}
          {isShop &&
            directCats.map((c) => (
              <span key={c._id} className="flex items-center">
                <Sep />
                <Link
                  href={`${base}?${param}=${c.slug}`}
                  className={linkCls(activeCat === c.slug)}
                >
                  {c.title}
                  <Underline on={activeCat === c.slug} />
                </Link>
              </span>
            ))}

          {/* blog / cars — purana chip style, ab slide row ke andar */}
          {!isShop &&
            cats.map((c) => {
              const active = activeCat === c.slug;
              return (
                <Link
                  key={c._id}
                  href={`${base}?${param}=${c.slug}`}
                  className={section === "blog" ? blogChip(active) : carChip(active)}
                >
                  {section === "cars" && <span>🚗</span>}
                  {c.title}
                  {section === "blog" && (
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-all ${
                        active ? "bg-accent" : "bg-transparent group-hover:bg-accent/40"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
        </div>

        {/* ✅ SLIDE ARROWS — desktop | mobile pe swipe */}
        <div className="hidden shrink-0 gap-1.5 sm:flex">
          <ArrowBtn dir={-1} onClick={() => slide(row1Ref, -1)} />
          <ArrowBtn dir={1} onClick={() => slide(row1Ref, 1)} />
        </div>
      </div>

      {/* ============ ROW 2 — SLIDE: SIRF OPEN MAIN KI CATEGORIES ============
          ROW 1 ke NICHE. Koi main open nahi → ye row bilkul hidden. */}
      {isShop && openMain && openChildren.length > 0 && (
        <div className="border-t border-gray-100 dark:border-[#1E3A52]/60">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5">
            <div
              ref={row2Ref}
              className="flex flex-1 items-center overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <span className="mr-2 shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                📂 {openMain.title}:
              </span>

              {/* All {main} — main ka apna page */}
              <Link
                href={`${base}?${param}=${openMain.slug}`}
                className={subLinkCls(activeCat === openMain.slug)}
                title={openMain.title}
              >
                All {openMain.title}
                <Underline on={activeCat === openMain.slug} />
              </Link>

              {/* open main ki attached categories */}
              {openChildren.map((c) => (
                <span key={c._id} className="flex items-center">
                  <Sep />
                  <Link
                    href={`${base}?${param}=${c.slug}`}
                    className={subLinkCls(activeCat === c.slug)}
                    title={c.title}
                  >
                    {c.title}
                    <Underline on={activeCat === c.slug} />
                  </Link>
                </span>
              ))}
            </div>

            {/* ✅ SLIDE ARROWS — desktop | mobile pe swipe */}
            <div className="hidden shrink-0 gap-1.5 sm:flex">
              <ArrowBtn dir={-1} onClick={() => slide(row2Ref, -1)} />
              <ArrowBtn dir={1} onClick={() => slide(row2Ref, 1)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
