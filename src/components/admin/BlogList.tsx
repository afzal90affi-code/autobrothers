"use client";

import { useCallback, useEffect, useState } from "react";
import { client } from "../../lib/sanityClient";
import { Pencil, Trash2, RefreshCw } from "lucide-react";

export default function BlogList({
  onEdit,
  refreshKey,
}: {
  onEdit: (blog: any) => void;
  refreshKey: number;
}) {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const b = await client.fetch<any[]>(
        `*[_type == "blog"] | order(date desc) {
          _id, title, "slug": slug.current, desc, writerName,
          seoTitle, seoDesc, isPublished, date, category, subCategory,
          "catTitle": category->title,
          content1, content2, content3, content4, content5,
          content6, content7, content8, content9, content10,
          "img1Url": img1.asset->url, "img2Url": img2.asset->url,
          "img3Url": img3.asset->url, "img4Url": img4.asset->url,
          "img5Url": img5.asset->url, "img6Url": img6.asset->url,
          "img7Url": img7.asset->url, "img8Url": img8.asset->url,
          "img9Url": img9.asset->url, "img10Url": img10.asset->url
        }`
      );
      setBlogs(b ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);

  const removeBlog = async (b: any) => {
    if (!confirm(`"${b.title}" delete karein?`)) return;
    const res = await fetch("/api/admin/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b._id }),
    });
    const r = await res.json();
    if (r.success) refresh();
    else alert(r.error || "Delete failed");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">All Blog Posts ({blogs.length})</h3>
        <button onClick={refresh}
          className="rounded-lg border border-[#1E3A52] p-2 text-gray-400 hover:text-[#F5A623] transition">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        [...Array(3)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-[#13293D]" />
        ))
      ) : blogs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#1E3A52] p-6 text-center text-sm text-gray-500">
          Koi blog nahi — upar se create karo
        </p>
      ) : (
        blogs.map((b) => (
          <div key={b._id}
            className="flex items-center gap-3 rounded-xl border border-[#1E3A52] bg-[#0D1F30] p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{b.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                {b.catTitle && (
                  <span className="rounded-full bg-[#F5A623]/15 px-2 py-0.5 text-[#F5A623]">
                    {b.catTitle}
                  </span>
                )}
                <span className={b.isPublished ? "text-emerald-400" : "text-gray-500"}>
                  {b.isPublished ? "Published" : "Draft"}
                </span>
                {b.date && (
                  <span className="text-gray-500">
                    {new Date(b.date).toLocaleDateString("en-GB")}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => onEdit(b)}
              className="rounded-lg border border-[#1E3A52] p-2 text-blue-400 hover:bg-blue-500/10 transition"
              title="Edit">
              <Pencil size={14} />
            </button>
            <button onClick={() => removeBlog(b)}
              className="rounded-lg border border-[#1E3A52] p-2 text-red-400 hover:bg-red-500/10 transition"
              title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
