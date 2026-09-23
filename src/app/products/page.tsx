"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, MessageCircle, ArrowRight, ShoppingCart, ChevronRight, X } from "lucide-react";
import { useCart } from "../../context/CartContext";

const WA = "923222806245";
const SITE_URL = "https://autobrothers.pk";

const waLink = (name: string, price?: string, url?: string) => {
  const text = `Salam! AutoBrothers mein "${name}"${price ? ` (${price})` : ""} ki detail chahiye.\n\n🔗 Link: ${url || ""}`;
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
};

const condBadge = (c: string) => {
  if (c === "Good") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (c === "Average") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
};

/* ============================================================
   MAIN CONTENT (Suspense ke andar — useSearchParams ki wajah se)
   ============================================================ */
function ProductsContent() {
  const { addToCart } = useCart();
  const searchParams = useSearchParams();

  const [cats, setCats] = useState<any[]>([]);
  const [prods, setProds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [sort, setSort] = useState("newest");
  const [initialized, setInitialized] = useState(false); // URL sync sirf pehli baar

  /* ---------- Data fetch (Sanity) ---------- */
  useEffect(() => {
    import("../../lib/sanityClient").then(({ client }) => {
      client
        .fetch(
          `*[_type == "category"] | order(coalesce(order, 9999) asc, title asc){ _id, title, "slug": slug.current }`
        )
        .then(setCats)
        .catch(() => {});
      client
        .fetch(
          `*[_type == "product" && defined(slug.current)] | order(_createdAt desc){
            _id, title, "id": slug.current, price, condition, inStock, featured, newArrival,
            description,
            "image": images[0].asset->url,
            "subTitle": subcategory->title,
            "subSlug": subcategory->slug.current,
            "catSlug": subcategory->parentCategory->slug.current,
            "catTitle": subcategory->parentCategory->title
          }`
        )
        .then(setProds)
        .finally(() => setLoading(false));
    });
  }, []);

  /* ---------- ✅ URL params sync — navbar/search ke links ab kaam karenge ---------- */
  useEffect(() => {
    if (initialized || loading) return;
    const urlCat = searchParams.get("cat");
    const urlQ = searchParams.get("q");

    if (urlQ) setSearchQ(urlQ);

    if (urlCat) {
      // Main category slug ya subcategory slug — dono check karo
      const isMainCat = cats.some((c: any) => c.slug === urlCat);
      const isSubCat = prods.some((p: any) => p.subSlug === urlCat);
      if (isMainCat || isSubCat) setFilterCat(urlCat);
    }
    setInitialized(true);
  }, [searchParams, cats, prods, loading, initialized]);

  /* ---------- ✅ Chips: main categories + subcategories dono ---------- */
  // Jo categories/products mein actually use ho rahi hain
  const usedMainCats = Array.from(
    new Map(prods.filter((p: any) => p.catSlug && p.catTitle).map((p: any) => [p.catSlug, p.catTitle]))
  ); // [slug, title][]

  const usedSubCats = Array.from(
    new Set(prods.map((p: any) => p.subTitle).filter(Boolean))
  ) as string[];

  /* ---------- Featured strip ---------- */
  const featured = prods.filter((p: any) => p.featured).slice(0, 6);

  /* ---------- ✅ Filter + Sort ---------- */
  const filtered = prods
    .filter((p: any) => {
      const mc =
        filterCat === "all" ||
        p.catSlug === filterCat ||   // main category match
        p.subSlug === filterCat ||   // subcategory slug match
        p.subTitle === filterCat;    // subcategory title match (back-compat)
      const ms =
        !searchQ ||
        (p.title || "").toLowerCase().includes(searchQ.toLowerCase()) ||
        (p.model || "").toLowerCase().includes(searchQ.toLowerCase()) ||
        (p.subTitle || "").toLowerCase().includes(searchQ.toLowerCase()) ||
        (p.catTitle || "").toLowerCase().includes(searchQ.toLowerCase());
      return mc && ms;
    })
    .sort((a: any, b: any) => {
      const pa = Number((a.price || "").replace(/[^\d]/g, "")) || 0;
      const pb = Number((b.price || "").replace(/[^\d]/g, "")) || 0;
      if (sort === "low") return pa - pb;
      if (sort === "high") return pb - pa;
      return 0;
    });

  /* ---------- Active filter ka display naam ---------- */
  const activeFilterName =
    filterCat === "all"
      ? null
      : usedSubCats.find((s) => prods.find((p: any) => p.subTitle === s)?.subSlug === filterCat) ??
        cats.find((c: any) => c.slug === filterCat)?.title ??
        prods.find((p: any) => p.catSlug === filterCat)?.catTitle ??
        prods.find((p: any) => p.subSlug === filterCat)?.subTitle ??
        filterCat;

  return (
    <main className="min-h-screen bg-white dark:bg-[#0A1929]">
      {/* ✅ SEO: ItemList schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Auto Parts Catalog",
            numberOfItems: prods.length,
            itemListElement: filtered.slice(0, 25).map((p: any, i: number) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.title,
              url: `${SITE_URL}/product/${p.id}`,
            })),
          }),
        }}
      />

      {/* ===== HERO (chhota — shop banner) ===== */}
      <section className="relative overflow-hidden">
        <div className="relative h-[280px] sm:h-[300px] md:h-[340px]">
          <img
            src="https://i.ibb.co/84814xg5/b16b-5542697ff3a9c-1296x.webp"
            alt="AutoBrothers — quality used auto parts shop Pakistan"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 dark:from-[#0A1929] dark:via-[#0A1929]/80 to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
            <div className="max-w-xl">
              <span className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase text-[#F5A623] bg-[#F5A623]/10 px-3 py-1.5 rounded-full mb-4 border border-[#F5A623]/20">
                🛒 Auto Parts Shop
              </span>
              <h1 className="font-extrabold text-3xl sm:text-4xl md:text-5xl leading-[1.08] mb-3 text-gray-900 dark:text-white">
                SHOP <span className="text-[#F5A623]">ALL PARTS</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-5 max-w-md">
                Engines, gearboxes, alternators — Japan imported, tested &amp; warranted. Order on WhatsApp.
              </p>
              <a
                href="#shop-products"
                className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold px-7 py-3 rounded-xl hover:scale-105 transition-all text-sm"
              >
                Browse Parts <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED STRIP ===== */}
      {featured.length > 0 && (
        <section className="pt-10 pb-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Featured</span>
                <h2 className="text-xl font-bold mt-1 text-gray-900 dark:text-white">Hot Deals 🔥</h2>
              </div>
              <a href="#shop-products" className="text-xs text-[#F5A623] flex items-center gap-1">
                View All <ChevronRight size={14} />
              </a>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {featured.map((p: any) => (
                <div key={p._id} className="flex-none w-[160px] sm:w-[220px]">
                  <Link
                    href={`/product/${p.id}`}
                    className="block bg-white dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-2xl overflow-hidden hover:border-[#F5A623]/40 transition-all group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={p.image || "https://picsum.photos/seed/d/400/500"}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {p.condition && (
                        <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm border ${condBadge(p.condition)}`}>
                          {p.condition}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-semibold truncate text-gray-900 dark:text-white group-hover:text-[#F5A623]">{p.title}</h4>
                      <span className="text-sm font-bold text-[#F5A623]">PKR {p.price || "Call"}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PRODUCTS GRID ===== */}
      <section id="shop-products" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Shop</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                {activeFilterName || "All Products"}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {loading ? "Loading…" : `${filtered.length} products`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search parts..."
                  className="pl-9 pr-8 py-2 bg-gray-100 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-lg text-xs text-gray-900 dark:text-white w-40 sm:w-52 focus:outline-none focus:border-[#F5A623]/50"
                />
                {searchQ && (
                  <button
                    onClick={() => setSearchQ("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-lg text-[11px] text-gray-600 dark:text-gray-400 focus:outline-none focus:border-[#F5A623]/50"
              >
                <option value="newest">Newest</option>
                <option value="low">Low→High</option>
                <option value="high">High→Low</option>
              </select>
            </div>
          </div>

          {/* ===== Category chips (Main cats + Sub cats groups) ===== */}
          <div className="space-y-2 mb-6">
            {/* Main categories */}
            {usedMainCats.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 self-center mr-1">Category:</span>
                {usedMainCats.map(([slug, title]: any) => (
                  <button
                    key={slug}
                    onClick={() => setFilterCat(filterCat === slug ? "all" : slug)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                      filterCat === slug
                        ? "bg-[#F5A623] text-[#0A1929]"
                        : "bg-gray-100 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] text-gray-600 dark:text-gray-400 hover:text-[#F5A623]"
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
            {/* Sub categories */}
            {usedSubCats.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 self-center mr-1">Type:</span>
                {usedSubCats.map((sub: any) => {
                  const slug = prods.find((p: any) => p.subTitle === sub)?.subSlug;
                  const val = slug || sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setFilterCat(filterCat === val ? "all" : val)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                        filterCat === val
                          ? "bg-[#F5A623] text-[#0A1929]"
                          : "bg-gray-100 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] text-gray-600 dark:text-gray-400 hover:text-[#F5A623]"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}
            {/* Active filter indicator */}
            {(filterCat !== "all" || searchQ) && (
              <div className="flex items-center gap-2">
                {activeFilterName && (
                  <button
                    onClick={() => setFilterCat("all")}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 px-3 py-1 text-[10px] font-bold text-[#F5A623] hover:bg-[#F5A623]/20"
                  >
                    {activeFilterName} <X size={11} />
                  </button>
                )}
                {searchQ && (
                  <button
                    onClick={() => setSearchQ("")}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] px-3 py-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  >
                    "{searchQ}" <X size={11} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ===== Grid / Loading / Empty ===== */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 dark:bg-[#13293D] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">No products found</h3>
              <p className="text-sm text-gray-500 mt-1">Search ya filter badal ke dekho</p>
              <button
                onClick={() => { setFilterCat("all"); setSearchQ(""); }}
                className="mt-5 inline-block rounded-xl bg-[#F5A623] px-6 py-2.5 text-sm font-bold text-[#0A1929] transition hover:bg-[#D4911E]"
              >
                Sab Products Dekho
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((p: any) => (
                <div
                  key={p._id}
                  className="bg-white dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-2xl overflow-hidden hover:border-[#F5A623]/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_-10px_rgba(245,166,35,0.12)] transition-all duration-300 group flex flex-col"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-[#0D1F30]">
                    <Link href={`/product/${p.id}`}>
                      <img
                        src={p.image || "https://picsum.photos/seed/d/400/400"}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      {p.condition && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm border ${condBadge(p.condition)}`}>
                          {p.condition}
                        </span>
                      )}
                      {p.newArrival && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/80 text-white backdrop-blur-sm border border-blue-400/30">
                          🆕 New
                        </span>
                      )}
                    </div>
                    {p.featured && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-orange-500/80 text-white backdrop-blur-sm border border-orange-400/30">
                        🔥
                      </span>
                    )}
                    {p.inStock === false && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-md font-bold text-[10px]">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 sm:p-3 flex flex-col flex-1 gap-1">
                    <Link href={`/product/${p.id}`}>
                      <h4 className="text-[11px] sm:text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#F5A623] transition-colors line-clamp-2 leading-snug">
                        {p.title}
                      </h4>
                    </Link>
                    {p.subTitle && (
                      <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{p.subTitle}</p>
                    )}
                    <div className="mt-auto pt-2">
                      <span className="text-sm sm:text-base font-extrabold text-[#F5A623]">PKR {p.price || "Call"}</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          disabled={p.inStock === false}
                          onClick={() =>
                            addToCart({
                              id: p.id,
                              title: p.title,
                              price: p.price || "",
                              image: p.image || "",
                              quantity: 1,
                              link: `${SITE_URL}/product/${p.id}`,
                              condition: p.condition,
                              description: p.description ? p.description.substring(0, 150) : "",
                            })
                          }
                          className="flex-1 flex items-center justify-center gap-1 bg-[#F5A623] hover:bg-[#D4911E] disabled:opacity-40 text-[#0A1929] py-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-colors"
                        >
                          <ShoppingCart size={12} /> Add
                        </button>
                        <button
                          onClick={() => window.open(waLink(p.title, p.price, `${SITE_URL}/product/${p.id}`), "_blank")}
                          className="flex-1 flex items-center justify-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white py-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-colors"
                        >
                          <MessageCircle size={13} /> Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   ✅ Suspense wrapper — useSearchParams build requirement
   ============================================================ */
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-[#0A1929] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5A623] border-t-transparent" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}