"use client";

import Link from "next/link";

/* ===== Types (yehi exports Navbar mein chahiye) ===== */
export type NavSection = "shop" | "blog" | "cars";
export type NavCat = { _id: string; title: string; slug: string };

type Props = {
  section: NavSection;
  cats: NavCat[];
  activeCat: string | null;
};

const scrollCls =
  "max-w-6xl mx-auto px-4 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/* ---------- SHOP: soft pill chips ---------- */
const shopChip = (active: boolean) =>
  `shrink-0 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
    active
      ? "bg-accent text-[#0A1929] shadow-md shadow-amber-500/25"
      : "bg-slate-100 dark:bg-navy-lighter text-slate-600 dark:text-slate-300 hover:bg-accent/15 hover:text-accent-dim dark:hover:text-accent"
  }`;

/* ---------- BLOG: serif magazine underline ---------- */
const blogChip = (active: boolean) =>
  `group relative shrink-0 py-3 text-sm font-serif tracking-wide transition-colors ${
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

export default function SecondaryNav({ section, cats, activeCat }: Props) {
  const base = section === "blog" ? "/blog" : section === "cars" ? "/new-cars" : "/products";
  const param = section === "cars" ? "brand" : "cat";
  const allLabel =
    section === "cars" ? "All Brands" : section === "blog" ? "All Posts" : "All Parts";
  const chip = section === "shop" ? shopChip : section === "blog" ? blogChip : carChip;

  return (
    <div className="border-b border-gray-100 dark:border-navy-border bg-white/80 dark:bg-navy-light/40 backdrop-blur">
      <div className={`${scrollCls} ${section === "blog" ? "gap-6" : "gap-2"} py-2.5`}>
        <Link href={base} className={chip(!activeCat)}>
          {allLabel}
          {section === "blog" && (
            <span
              className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-all ${
                !activeCat ? "bg-accent" : "bg-transparent group-hover:bg-accent/40"
              }`}
            />
          )}
        </Link>

        {cats.map((c) => {
          const active = activeCat === c.slug;
          return (
            <Link key={c._id} href={`${base}?${param}=${c.slug}`} className={chip(active)}>
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
    </div>
  );
}