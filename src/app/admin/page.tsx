"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { client } from "../../lib/sanityClient";

/* ---------- Quick action links ---------- */
const ACTIONS = [
  { label: "Add Product", href: "/admin/products", icon: "🛒", desc: "Naya part list karo" },
  { label: "Write Blog", href: "/admin/blog", icon: "✍️", desc: "Quill editor se post" },
  { label: "Add Car", href: "/admin/new-cars", icon: "🚗", desc: "New car + finance" },
  { label: "Categories", href: "/admin/categories", icon: "📂", desc: "Manage categories" },
];

type Counts = { products: number; blogs: number; cars: number; banks: number; cats: number; subs: number };
type RecentItem = { _id: string; title: string; type: string; href: string; date: string };
type RecentItemsResponse = { items: RecentItem[] };

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts>({ products: 0, blogs: 0, cars: 0, banks: 0, cats: 0, subs: 0 });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.fetch<number>('count(*[_type == "product"])'),
      client.fetch<number>('count(*[_type == "blog"])'),
      client.fetch<number>('count(*[_type == "car"])'),
      client.fetch<number>('count(*[_type == "financeBank"])'),
      client.fetch<number>('count(*[_type == "category"])'),
      client.fetch<number>('count(*[_type == "subcategory"])'),
      client.fetch<RecentItemsResponse>(
        `{
          "items": (
            (*[_type == "product" && defined(slug.current)] | order(_createdAt desc)[0...3] {
              _id, title, "type": "🛒 Product", "href": "/product/" + slug.current, "date": _createdAt
            })
            | (*[_type == "blog" && defined(slug.current)] | order(_createdAt desc)[0...3] {
              _id, title, "type": "📝 Blog", "href": "/blog/" + slug.current, "date": _createdAt
            })
            | (*[_type == "car" && defined(slug.current)] | order(_createdAt desc)[0...3] {
              _id, title, "type": "🚗 Car", "href": "/new-cars", "date": _createdAt
            })
          ) | order(date desc) [0...6]
        }`
      ).then((d) => setRecent(d?.items ?? [])).catch(() => {}),
    ])
      .then(([p, b, c, bk, cat, sub]) =>
        setCounts({ products: p, blogs: b, cars: c, banks: bk, cats: cat, subs: sub })
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Products", value: counts.products, href: "/admin/products", icon: "🛒" },
    { label: "Total Blogs", value: counts.blogs, href: "/admin/blog", icon: "📝" },
    { label: "New Cars", value: counts.cars, href: "/admin/new-cars", icon: "🚗" },
    { label: "Finance Banks", value: counts.banks, href: "/admin/new-cars", icon: "🏦" },
    { label: "Categories", value: counts.cats, href: "/admin/categories", icon: "📂" },
    { label: "Sub-Categories", value: counts.subs, href: "/admin/categories", icon: "🗂️" },
  ];

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A1929]">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">

        {/* ---------- Header ---------- */}
        <div className="mb-8">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F5A623]">AutoBrothers</p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white md:text-3xl">
            Dashboard 📊
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Site ka live overview — sab kuch yahan se manage karo
          </p>
        </div>

        {/* ---------- Quick Actions ---------- */}
        <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ACTIONS.map((a) => (
            <Link key={a.label} href={a.href}
              className="group rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#FFB94D] p-[1.5px] transition hover:shadow-lg hover:shadow-amber-500/20">
              <div className="h-full rounded-[14px] bg-white dark:bg-[#13293D] p-4">
                <span className="text-2xl">{a.icon}</span>
                <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#F5A623] transition">
                  {a.label}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ---------- Stats Grid ---------- */}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((c) => (
            <Link key={c.label} href={c.href}
              className="group bg-white dark:bg-[#13293D] p-5 rounded-2xl border border-gray-200 dark:border-[#1E3A52] transition hover:border-[#F5A623]/50 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xs text-gray-500 dark:text-gray-400">{c.icon} {c.label}</h3>
                <span className="text-gray-300 dark:text-gray-600 group-hover:text-[#F5A623] transition">→</span>
              </div>
              <p className="text-3xl font-bold text-[#F5A623] mt-2">
                {loading ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-gray-200 dark:bg-[#1E3A52]" /> : c.value}
              </p>
            </Link>
          ))}
        </div>

        {/* ---------- Recent Items ---------- */}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">Recently Added</h2>
        <div className="bg-white dark:bg-[#13293D] rounded-2xl border border-gray-200 dark:border-[#1E3A52] overflow-hidden">
          {!loading && recent.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">
              Abhi kuch add nahi hua — upar se Product, Blog ya Car add karo!
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-[#1E3A52]">
              {(loading ? [...Array(4)] : recent).map((r: any, i: number) => (
                <li key={r?._id ?? i}>
                  <Link href={r?.href ?? "#"} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-[#1E3A52]/30 transition">
                    <span className="text-sm">{r ? r.type.split(" ")[0] : "·"}</span>
                    <div className="min-w-0 flex-1">
                      {loading ? (
                        <div className="h-3.5 w-40 animate-pulse rounded bg-gray-200 dark:bg-[#1E3A52]" />
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.title}</p>
                          <p className="text-[10px] text-gray-400">{r.type.split(" ").slice(1).join(" ")} • {fmtDate(r.date)}</p>
                        </>
                      )}
                    </div>
                    <span className="text-gray-300 dark:text-gray-600 text-sm">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}