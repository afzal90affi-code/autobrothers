import type { Metadata } from "next";
import Link from "next/link";
import { client } from "../../lib/sanityClient";
import BlogCard from "../../components/BlogCard";

export const revalidate = 60;

const BASE_URL = "https://autobrothers.pk";
const POSTS_PER_PAGE = 9;

const readExpr = Array.from({ length: 10 }, (_, i) => `coalesce(length(content${i + 1}), 0)`).join(" + ");

type Cat = { _id: string; title: string; slug: string };

async function getCategories(): Promise<Cat[]> {
  return client
    .fetch<Cat[]>(
      `*[_type == "blogCategory" && defined(slug.current)] | order(coalesce(order, 9999) asc, title asc){ _id, title, "slug": slug.current }`
    )
    .catch((e) => {
      console.error("🔴 CAT FETCH FAILED:", e?.message || e);
      return [];
    });
}

async function getPosts(catSlug?: string, page = 0): Promise<{ posts: any[]; total: number }> {
  const filter = catSlug
    ? `*[_type == "blog" && isPublished == true && defined(slug.current) && category->slug.current == $catSlug]`
    : `*[_type == "blog" && isPublished == true && defined(slug.current)]`;

  const query = `{
    "posts": ${filter} | order(coalesce(order, 9999) asc, date desc) [0...200] {
      _id, title, desc, date,
      "slug": slug.current,
      "catTitle": category->title,
      "catSlug": category->slug.current,
      "cover": img1.asset->url,
      "readRaw": (${readExpr})
    },
    "total": count(${filter})
  }`;

  return client
    .fetch<{ posts: any[]; total: number }>(
      query,
      catSlug ? { catSlug } : {}
    )
    .then((d) => {
      const all = (d.posts || []).map((b: any) => ({
        ...b,
        read: Math.max(1, Math.ceil((b.readRaw || 0) / 1200)),
      }));
      return {
        posts: all.slice(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE),
        total: d.total,
      };
    })
    .catch((e) => {
      console.error("🔴 BLOG FETCH FAILED:", e?.message || e);
      return { posts: [], total: 0 };
    });
}

/* ================= SEO ================= */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { cat?: string };
}): Promise<Metadata> {
  const catSlug = searchParams?.cat;
  let title = "Blog — Car Care Tips, Guides & Auto News";
  let desc =
    "Expert car care tips, maintenance guides, auto parts reviews aur latest automotive news — AutoBrothers Pakistan.";

  if (catSlug) {
    const cat: Cat | null = await client
      .fetch(`*[_type == "blogCategory" && slug.current == $slug][0]{ title }`, { slug: catSlug })
      .catch(() => null);
    if (cat) {
      title = `${cat.title} — Blog`;
      desc = `${cat.title} se related expert articles aur guides — AutoBrothers Pakistan.`;
    }
  }

  const url = catSlug ? `${BASE_URL}/blog?cat=${catSlug}` : `${BASE_URL}/blog`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url, type: "website", siteName: "AutoBrothers" },
    twitter: { card: "summary_large_image", title, description: desc },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { cat?: string; page?: string };
}) {
  const catSlug = searchParams?.cat;
  const page = Math.max(0, parseInt(searchParams?.page || "0", 10) || 0);

  const [cats, { posts, total }] = await Promise.all([
    getCategories(),
    getPosts(catSlug, page),
  ]);

  const activeCat = cats.find((c) => c.slug === catSlug);
  const hasNext = (page + 1) * POSTS_PER_PAGE < total;
  const [featured, ...rest] = posts;

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "AutoBrothers Journal",
    url: `${BASE_URL}/blog`,
    description: "Car care tips, maintenance guides aur auto news — Pakistan",
    publisher: { "@type": "Organization", name: "AutoBrothers", url: BASE_URL },
    blogPost: posts.map((p: any) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${BASE_URL}/blog/${p.slug}`,
      datePublished: p.date,
      image: p.cover || undefined,
      author: { "@type": "Organization", name: "AutoBrothers" },
    })),
  };

  const pageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (catSlug) params.set("cat", catSlug);
    if (p > 0) params.set("page", String(p));
    const qs = params.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  };

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

  const pillCls = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition sm:text-sm ${
      active
        ? "bg-[#F5A623] text-[#0A1929] shadow-md shadow-[#F5A623]/25"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#13293D] dark:text-gray-400 dark:ring-1 dark:ring-[#1E3A52] dark:hover:text-white"
    }`;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />

           {/* ================= CATEGORY NAVBAR — text style with | separators ================= */}
      <div className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-[#1E3A52] dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-6xl items-center overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* All Posts */}
          <Link
            href="/blog"
            className={`relative shrink-0 px-1 py-2 text-sm font-semibold tracking-wide transition-colors duration-300 ${
              !catSlug
                ? "text-[#F5A623]"
                : "text-gray-700 hover:text-[#F5A623] dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            All Posts
            <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] transition-transform duration-300 ${
              !catSlug ? "scale-x-100" : "scale-x-0"
            }`} />
          </Link>

          {cats.map((c) => (
            <span key={c._id} className="flex items-center">
              {/* | separator */}
              <span className="mx-3 h-4 w-px shrink-0 bg-gray-300 dark:bg-[#1E3A52]" aria-hidden="true" />
              <Link
                href={`/blog?cat=${c.slug}`}
                className={`relative shrink-0 px-1 py-2 text-sm font-semibold tracking-wide transition-colors duration-300 ${
                  catSlug === c.slug
                    ? "text-[#F5A623]"
                    : "text-gray-700 hover:text-[#F5A623] dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                {c.title}
                <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] transition-transform duration-300 ${
                  catSlug === c.slug ? "scale-x-100" : "scale-x-0"
                }`} />
              </Link>
            </span>
          ))}
        </div>
      </div>

      {/* ================= Masthead ================= */}
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#F5A623]">
            AutoBrothers Journal
          </p>
          <h1 className="mt-2 md:mt-3 text-xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {activeCat ? activeCat.title : "Car Care Tips & Auto Guides"}
          </h1>
          <p className="mx-auto mt-2 md:mt-3 max-w-lg text-xs md:text-sm text-gray-500 dark:text-gray-400">
            {activeCat
              ? `${activeCat.title} se related expert articles`
              : "Maintenance guides, parts reviews aur automotive news"}
          </p>
          {total > 0 && <p className="mt-1.5 text-[11px] text-gray-400">{total} articles</p>}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        {/* ================= Featured Post — sirf All + page 1 ================= */}
        {featured && !catSlug && page === 0 && (
          <Link href={`/blog/${featured.slug}`} className="group mb-8 md:mb-10 block">
            <article className="relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-gray-100 dark:ring-gray-800">
              <div className="relative h-56 sm:h-96 md:h-[26rem]">
                {featured.cover ? (
                  <img
                    src={`${featured.cover}?w=1400&auto=format&q=80`}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#112240] to-[#1E3A52] text-6xl">
                    📰
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1929] via-[#0A1929]/50 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
                  <div className="mb-2 md:mb-3 flex flex-wrap items-center gap-2">
                    {featured.catTitle && (
                      <span className="rounded-full bg-[#F5A623] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#0A1929]">
                        {featured.catTitle}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-300">{fmtDate(featured.date)}</span>
                    <span className="rounded-full border border-white/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/90">
                      ★ Latest
                    </span>
                  </div>
                  <h2 className="max-w-3xl text-lg font-bold leading-snug text-white transition group-hover:text-[#F5A623] sm:text-3xl md:text-4xl">
                    {featured.title}
                  </h2>
                  {featured.desc && (
                    <p className="mt-2 hidden max-w-2xl text-sm text-slate-300 sm:block line-clamp-2">
                      {featured.desc}
                    </p>
                  )}
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* ================= Grid ================= */}
        {posts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 py-14 md:py-20 text-center dark:border-gray-800 dark:bg-gray-900/40">
            <span className="text-5xl">📝</span>
            <h3 className="mt-4 text-xl font-bold text-gray-700 dark:text-gray-200">Abhi koi article nahi</h3>
            <p className="mt-1 text-sm text-gray-400">Naye articles jald post honge — stay tuned!</p>
            {catSlug && (
              <Link href="/blog" className="mt-6 inline-block rounded-xl bg-[#F5A623] px-6 py-2.5 text-sm font-bold text-[#0A1929] transition hover:bg-[#FFB94D]">
                Sab Posts Dekho
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(catSlug || page > 0 ? posts : rest).map((b: any) => (
              <BlogCard key={b._id} post={b} />
            ))}
          </div>
        )}

        {/* ================= Pagination ================= */}
        {(page > 0 || hasNext) && (
          <nav className="mt-8 md:mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
            {page > 0 && (
              <Link href={pageUrl(page - 1)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:border-[#F5A623] hover:text-[#F5A623] dark:border-gray-800 dark:text-gray-300">
                ← Newer
              </Link>
            )}
            <span className="rounded-xl bg-[#F5A623]/10 px-4 py-2.5 text-sm font-black text-[#F5A623]">
              {page + 1}
            </span>
            {hasNext && (
              <Link href={pageUrl(page + 1)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:border-[#F5A623] hover:text-[#F5A623] dark:border-gray-800 dark:text-gray-300">
                Older →
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}