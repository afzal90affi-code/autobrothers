"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { writeClient } from "../../../lib/sanityadmin";
import AddProductForm from "../../../components/ProductForm";
import { Plus, Trash2, Search, ExternalLink, RefreshCw } from "lucide-react";

type P = {
  _id: string; title: string; slug: string; price?: string;
  condition?: string; inStock?: boolean; featured?: boolean; newArrival?: boolean;
  image?: string; catTitle?: string; subTitle?: string; _createdAt: string;
};

const condBadge = (c?: string) => {
  if (c === "Good") return "bg-green-500/15 text-green-400 border-green-500/30";
  if (c === "Average") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  if (c === "Bad") return "bg-red-500/15 text-red-400 border-red-500/30";
  return "";
};

export default function AdminProductsPage() {
  const [prods, setProds] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await writeClient.fetch<P[]>(
        `*[_type == "product" && defined(slug.current)] | order(_createdAt desc){
          _id, title, "slug": slug.current, price, condition, inStock, featured, newArrival,
          "image": images[0].asset->url,
          "catTitle": subcategory->parentCategory->title,
          "subTitle": subcategory->title,
          _createdAt
        }`
      );
      setProds(d ?? []);
    } catch {
      setProds([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const remove = async (p: P) => {
    if (!confirm(`"${p.title}" DELETE karein? Ye wapas nahi aayega!`)) return;
    try {
      await writeClient.delete(p._id);
      setProds((prev) => prev.filter((x) => x._id !== p._id));
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  };

  const filtered = prods.filter(
    (p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.subTitle || "").toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F5A623]">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">Products 🛒</h1>
            <p className="mt-1 text-xs text-gray-500">{prods.length} products — list, add aur delete yahan se</p>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} title="Refresh"
              className="rounded-xl border border-[#1E3A52] p-2.5 text-gray-400 hover:border-[#F5A623] hover:text-[#F5A623] transition">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FFB94D] px-4 py-2.5 text-sm font-bold text-[#0A1929] shadow-lg shadow-amber-500/20">
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-[#1E3A52] bg-[#13293D] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-[#F5A623]" />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[#13293D]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1E3A52] py-16 text-center">
            <span className="text-4xl">📦</span>
            <p className="mt-3 text-sm text-gray-400">
              {prods.length === 0 ? "Koi product nahi — pehla product add karo!" : "Search se kuch nahi mila"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <div key={p._id}
                className="flex items-center gap-3 rounded-xl border border-[#1E3A52] bg-[#0D1F30] p-3 transition hover:border-[#F5A623]/40">
                {p.image ? (
                  <img src={`${p.image}?w=120&h=120&fit=crop&auto=format&q=70`} alt={p.title}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#13293D] text-xl">📦</div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{p.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-black text-[#F5A623]">PKR {p.price || "Call"}</span>
                    {p.condition && (
                      <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${condBadge(p.condition)}`}>
                        {p.condition}
                      </span>
                    )}
                    {p.featured && <span className="rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold text-orange-400">🔥</span>}
                    {p.newArrival && <span className="rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">NEW</span>}
                    {!p.inStock && <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">OUT</span>}
                    {p.subTitle && <span className="text-[10px] text-gray-500">{p.catTitle} › {p.subTitle}</span>}
                  </div>
                  <p className="text-[10px] text-gray-600">{fmtDate(p._createdAt)}</p>
                </div>

                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <Link href={`/product/${p.slug}`} target="_blank" title="View on site"
                    className="rounded-lg border border-[#1E3A52] p-2 text-gray-400 hover:text-[#F5A623] hover:border-[#F5A623]/50 transition">
                    <ExternalLink size={14} />
                  </Link>
                  <button onClick={() => remove(p)} title="Delete"
                    className="rounded-lg border border-red-900/50 p-2 text-red-400 hover:bg-red-500/10 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add drawer (existing form) */}
      {addOpen && <AddProductForm onClose={() => { setAddOpen(false); refresh(); }} />}
    </div>
  );
}