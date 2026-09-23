"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { client } from "../../../lib/sanityClient";
import BlogForm from "../../../components/BlogForm";
import { Plus, Trash2, Search, ExternalLink, RefreshCw, Eye, EyeOff, X, Pencil } from "lucide-react";

type B = {
  _id: string; title: string; slug?: string; desc?: string;
  isPublished?: boolean; date?: string; _createdAt: string;
  catTitle?: string; subTitle?: string; cover?: string;
  writerName?: string; seoTitle?: string; seoDesc?: string;
  category?: any; subCategory?: any;
  content1?: string; content2?: string; content3?: string; content4?: string; content5?: string;
  content6?: string; content7?: string; content8?: string; content9?: string; content10?: string;
  img1Url?: string; img2Url?: string; img3Url?: string; img4Url?: string; img5Url?: string;
  img6Url?: string; img7Url?: string; img8Url?: string; img9Url?: string; img10Url?: string;
};
type Cat = { _id: string; title: string; slug?: string };
type SubCat = { _id: string; title: string; slug?: string; parentId: string };

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<B[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [subCats, setSubCats] = useState<SubCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  /* ✅ NAYA: editing state — Edit button ke liye */
  const [editing, setEditing] = useState<B | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c, s] = await Promise.all([
        /* ✅ client (read) — writeClient ki zaroorat nahi */
        client.fetch<B[]>(
          `*[_type == "blog"] | order(_createdAt desc){
            _id, title, "slug": slug.current, desc, isPublished, date, _createdAt,
            "catTitle": category->title,
            "subTitle": subCategory->title,
            "cover": img1.asset->url,
            writerName, seoTitle, seoDesc, category, subCategory,
            content1, content2, content3, content4, content5,
            content6, content7, content8, content9, content10,
            "img1Url": img1.asset->url, "img2Url": img2.asset->url,
            "img3Url": img3.asset->url, "img4Url": img4.asset->url,
            "img5Url": img5.asset->url, "img6Url": img6.asset->url,
            "img7Url": img7.asset->url, "img8Url": img8.asset->url,
            "img9Url": img9.asset->url, "img10Url": img10.asset->url
          }`
        ).catch(() => []),
        client.fetch<Cat[]>(`*[_type == "blogCategory"]{ _id, title, "slug": slug.current }`).catch(() => []),
        client.fetch<SubCat[]>(`*[_type == "blogSubcategory"]{ _id, title, "slug": slug.current, "parentId": parentCategory->_id }`).catch(() => []),
      ]);
      setBlogs(b ?? []);
      setCats(c ?? []);
      setSubCats(s ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /* ✅ FIX: patch ab API route se (browser se writeClient nahi) */
  const togglePublish = async (b: B) => {
    try {
      const res = await fetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b._id, patch: { isPublished: !b.isPublished } }),
      });
      const r = await res.json();
      if (r.success) {
        setBlogs((prev) => prev.map((x) => (x._id === b._id ? { ...x, isPublished: !x.isPublished } : x)));
      } else {
        alert(r.error || "Failed");
      }
    } catch (e: any) {
      alert(e?.message || "Failed");
    }
  };

  /* ✅ FIX: delete ab API route se */
  const remove = async (b: B) => {
    if (!confirm(`"${b.title}" DELETE karein?`)) return;
    try {
      const res = await fetch("/api/admin/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b._id }),
      });
      const r = await res.json();
      if (r.success) {
        setBlogs((prev) => prev.filter((x) => x._id !== b._id));
      } else {
        alert(r.error || "Delete failed");
      }
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  };

  /* ✅ NAYA: edit start — form open + prefill data pass */
  const startEdit = (b: B) => {
    setEditing(b);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = blogs.filter(
    (b) => !search || b.title.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F5A623]">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">Blog Posts 📝</h1>
            <p className="mt-1 text-xs text-gray-500">
              {blogs.length} posts • {blogs.filter((b) => b.isPublished).length} published
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} title="Refresh"
              className="rounded-xl border border-[#1E3A52] p-2.5 text-gray-400 hover:border-[#F5A623] hover:text-[#F5A623] transition">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => { setShowForm(!showForm); if (showForm) setEditing(null); }}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg transition ${
                showForm
                  ? "border border-[#1E3A52] bg-[#13293D] text-gray-300 shadow-none"
                  : "bg-gradient-to-r from-[#F5A623] to-[#FFB94D] text-[#0A1929] shadow-amber-500/20"
              }`}>
              {showForm ? (<><X size={16} /> Close Form</>) : (<><Plus size={16} /> Write Blog</>)}
            </button>
          </div>
        </div>

        {/* Form (toggle) — ✅ editing props pass + key for fresh prefill */}
        {showForm && (
          <div className="mb-8">
            <BlogForm
              key={editing?._id ?? "new"}
              catList={cats}
              subCatList={subCats}
              editing={editing}
              onCancelEdit={() => { setEditing(null); setShowForm(false); }}
              onSaved={() => { setShowForm(false); setEditing(null); refresh(); }}
            />
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-xl border border-[#1E3A52] bg-[#13293D] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:border-[#F5A623]" />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[#13293D]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1E3A52] py-16 text-center">
            <span className="text-4xl">📝</span>
            <p className="mt-3 text-sm text-gray-400">
              {blogs.length === 0 ? "Koi post nahi — pehli blog likho!" : "Search se kuch nahi mila"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => (
              <div key={b._id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                  editing?._id === b._id
                    ? "border-[#F5A623]/60 bg-[#13293D]"
                    : "border-[#1E3A52] bg-[#0D1F30] hover:border-[#F5A623]/40"
                }`}>
                {b.cover ? (
                  <img src={`${b.cover}?w=120&h=120&fit=crop&auto=format&q=70`} alt={b.title}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#13293D] text-xl">📝</div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{b.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                      b.isPublished
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}>
                      {b.isPublished ? "● LIVE" : "○ DRAFT"}
                    </span>
                    {b.catTitle && <span className="text-[10px] text-gray-500">{b.catTitle}{b.subTitle ? ` › ${b.subTitle}` : ""}</span>}
                    {editing?._id === b._id && (
                      <span className="rounded-md bg-[#F5A623]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#F5A623]">
                        ✎ EDITING
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600">{fmtDate(b.date || b._createdAt)}</p>
                </div>

                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  {b.isPublished && b.slug && (
                    <Link href={`/blog/${b.slug}`} target="_blank" title="View on site"
                      className="rounded-lg border border-[#1E3A52] p-2 text-gray-400 hover:text-[#F5A623] hover:border-[#F5A623]/50 transition">
                      <ExternalLink size={14} />
                    </Link>
                  )}
                  {/* ✅ NAYA: Edit button */}
                  <button onClick={() => startEdit(b)} title="Edit post"
                    className="rounded-lg border border-blue-900/50 p-2 text-blue-400 hover:bg-blue-500/10 transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => togglePublish(b)}
                    title={b.isPublished ? "Unpublish (draft banao)" : "Publish (live karo)"}
                    className={`rounded-lg border p-2 transition ${
                      b.isPublished
                        ? "border-yellow-900/50 text-yellow-400 hover:bg-yellow-500/10"
                        : "border-green-900/50 text-green-400 hover:bg-green-500/10"
                    }`}>
                    {b.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => remove(b)} title="Delete"
                    className="rounded-lg border border-red-900/50 p-2 text-red-400 hover:bg-red-500/10 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}