"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { client } from "../lib/sanityClient";

type Prod = {
  _id: string; title: string; slug: string; price: string;
  image?: string; condition?: string; model?: string;
  category?: string; subCat?: string;
};
type Cat = { _id: string; title: string; slug: string };

const conditionStyle: Record<string, string> = {
  Good: "bg-emerald-500/15 text-emerald-500",
  Average: "bg-amber-500/15 text-amber-500",
  Bad: "bg-rose-500/15 text-rose-500",
};

export default function CategoryShop() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [active, setActive] = useState("all");
  const [prods, setProds] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.fetch<Cat[]>(
      `*[_type == "category"] | order(title asc) { _id, title, "slug": slug.current }`
    ).then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const fields = `
      _id, title, "slug": slug.current, price, condition, model,
      "image": images[0].asset->url,
      "subCat": subcategory->title,
      "category": subcategory->parentCategory->title
    `;
    const query = active === "all"
      ? `*[_type == "product"] | order(_createdAt desc) [0...12] { ${fields} }`
      : `*[_type == "product" && subcategory->parentCategory._id == $catId] | order(_createdAt desc) [0...12] { ${fields} }`;

    client.fetch<Prod[]>(query, { catId: active })
      .then(setProds)
      .catch(() => setProds([]))
      .finally(() => setLoading(false));
  }, [active]);

  const pill = (id: string, label: string) => (
    <button key={id} onClick={() => setActive(id)}
      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition sm:text-sm ${
        active === id
          ? "bg-[#F5A623] text-[#0A1929]"
          : "bg-[#112240] text-gray-400 ring-1 ring-[#1E3A52] hover:text-white"
      }`}>
      {label}
    </button>
  );

  return (
    <div className="bg-[#0A1929] text-white">
      <div className="sticky top-0 z-30 border-b border-[#1E3A52] bg-[#0A1929]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pill("all", "All")}
          {cats.map((c) => pill(c._id, c.title))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-[#13293D]" />
            ))}
          </div>
        ) : prods.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">Is category mein products nahi hain.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {prods.map((p) => (
              <Link key={p._id} href={`/product/${p.slug}`}>
                <div className="group overflow-hidden rounded-2xl bg-[#112240] ring-1 ring-[#1E3A52] transition-all hover:-translate-y-1">
                  {p.image ? (
                    <img src={p.image} alt={p.title} loading="lazy" className="h-36 w-full object-cover sm:h-40" />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center bg-[#0D1F30] sm:h-40">📦</div>
                  )}
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-bold text-white">{p.title}</p>
                    <p className="text-sm font-black text-[#F5A623]">Rs {Number(p.price || 0).toLocaleString("en-PK")}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}