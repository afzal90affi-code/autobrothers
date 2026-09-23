import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { client } from "../../../lib/sanityClient";
import { cleanQuillHtml } from "../../../lib/cleanQuillHtml";
import BlogCard from "../../../components/BlogCard";

export const revalidate = 60;

const readExpr = Array.from({ length: 10 }, (_, i) => `coalesce(length(content${i + 1}), 0)`).join(" + ");
const imgProj = Array.from({ length: 10 }, (_, i) => `"img${i + 1}Url": img${i + 1}.asset->url`).join(", ");

const BASE_URL = "https://autobrothers.pk";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post: any = await client.fetch(
    `*[_type == "blog" && slug.current == $slug && isPublished != false][0]{ title, desc, seoTitle, seoDesc, date, "og": img1.asset->url }`,
    { slug: params.slug }
  );
  if (!post) return {};
  const og = post.og ? `${post.og}?w=800&auto=format&q=70` : undefined;
  const finalTitle = post.seoTitle || post.title;
  const finalDesc = post.seoDesc || post.desc || undefined;

  return {
    title: finalTitle,
    description: finalDesc,
    alternates: { canonical: `${BASE_URL}/blog/${params.slug}` },
    openGraph: {
      title: finalTitle,
      description: finalDesc,
      type: "article",
      publishedTime: post.date,
      url: `${BASE_URL}/blog/${params.slug}`,
      images: og ? [og] : undefined,
    },
    twitter: { card: "summary_large_image", title: finalTitle, description: finalDesc },
  };
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const post: any = await client.fetch(
    `*[_type == "blog" && slug.current == $slug][0]{ ..., "slug": slug.current,
      "catTitle": category->title, "catSlug": category->slug.current, "subTitle": subCategory->title, ${imgProj} }`,
    { slug: params.slug }
  );
  if (!post || !post.isPublished) notFound();

  /* COVER = img1 | SECTIONS = content1→img2, content2→img3 ... */
  const coverImg = post.img1Url;

  const sections = Array.from({ length: 10 }, (_, i) => ({
    html: cleanQuillHtml(post[`content${i + 1}`]),
    img: post[`img${i + 2}Url`],
  })).filter((s) => s.html || s.img);

  const words = sections.reduce((a, s) => a + s.html.replace(/<[^>]*>/g, " ").length, 0);
  const read = Math.max(1, Math.ceil(words / 1200));

  const [relBlogs, relProducts] = await Promise.all([
    client.fetch(
      `*[_type == "blog" && isPublished == true && slug.current != $slug][0..2] | order(coalesce(order, 9999) asc, date desc){ _id, title, desc, date, "slug": slug.current, "catTitle": category->title, "cover": img1.asset->url, "readRaw": (${readExpr}) }`,
      { slug: post.slug }
    ),
    client
      .fetch(
        `*[_type == "product" && defined(slug.current) && category->title == $cat][0...4]{ _id, title, "slug": slug.current, "img": images[0].asset->url, price }`,
        { cat: post.catTitle || "" }
      )
      .catch(() => []),
  ]);

  const products: any[] = relProducts?.length
    ? relProducts
    : await client
        .fetch(`*[_type == "product" && defined(slug.current)] | order(_createdAt desc) [0...4]{ _id, title, "slug": slug.current, "img": images[0].asset->url, price }`)
        .catch(() => []);

  const relBlogsFixed = (relBlogs || []).map((b: any) => ({
    ...b,
    read: Math.max(1, Math.ceil((b.readRaw || 0) / 1200)),
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.desc,
    image: post.img1Url ? `${post.img1Url}?w=1200&auto=format&q=80` : undefined,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${post.slug}` },
    author: { "@type": "Person", name: post.writerName || "AutoBrothers" },
    publisher: { "@type": "Organization", name: "AutoBrothers" },
  };

  /* ---------- Share URLs ---------- */
  const postUrl = `${BASE_URL}/blog/${post.slug}`;
  const shareTitle = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(postUrl);

  const shareLinks = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${shareTitle}%20%0A%0A${shareUrl}`,
      bg: "bg-[#25D366] hover:bg-[#1fb857]",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      bg: "bg-[#1877F2] hover:bg-[#166FE5]",
    },
    {
      name: "Instagram",
      href: "https://instagram.com/autobrothers.pk",
      bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:opacity-90",
    },
    {
      name: "TikTok",
      href: "https://www.tiktok.com/@autobrothers.pk",
      bg: "bg-black hover:bg-gray-900 ring-1 ring-white/20",
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <article className="max-w-3xl mx-auto px-4 pt-6 md:pt-10">
        {/* ===== NAV ===== */}
        <nav className="text-[11px] md:text-xs text-gray-400 flex items-center justify-center md:justify-start gap-2">
          <Link href="/" className="hover:text-[#F5A623]">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#F5A623]">Blog</Link>
          {post.catTitle && (
            <>
              <span>/</span>
              <span className="text-gray-600 dark:text-gray-300">{post.catTitle}</span>
            </>
          )}
        </nav>

        {/* ===== TITLE — CENTERED ===== */}
        <div className="text-center mt-4 md:mt-5">
          {post.catTitle && (
            <span className="inline-block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#F5A623]">
              {post.catTitle}
              {post.subTitle ? ` — ${post.subTitle}` : ""}
            </span>
          )}
          {/* Mobile: chhota + tight | Desktop: bada */}
          <h1 className="mt-2 text-xl sm:text-2xl md:text-4xl font-bold leading-snug md:leading-tight text-gray-900 dark:text-white">
            {post.title}
          </h1>

          {/* ===== SUMMARY — CENTERED, better contrast ===== */}
          {post.desc && (
            <p className="mt-3 text-sm md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {post.desc}
            </p>
          )}
        </div>

        {/* ===== AUTHOR + SHARE — CENTERED, compact ===== */}
        <div className="mt-4 md:mt-6 flex flex-col items-center gap-3 border-y border-gray-100 dark:border-gray-800 py-3 md:py-4">
          {/* Author */}
          <div className="flex items-center gap-3 text-xs md:text-sm text-gray-400">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-[#F5A623]/15 text-[#F5A623] flex items-center justify-center font-bold">
              {(post.writerName || "AB")[0].toUpperCase()}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {post.writerName || "AutoBrothers"}
              </p>
              <p className="text-[10px] md:text-xs">
                {post.date
                  ? new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                  : ""}{" "}
                • {read} min read
              </p>
            </div>
          </div>

          {/* ===== SOCIAL SHARE BUTTONS ===== */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {shareLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${s.name}`}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 ${s.bg}`}
              >
                {s.name === "WhatsApp" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                )}
                {s.name === "Facebook" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                )}
                {s.name === "Instagram" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                )}
                {s.name === "TikTok" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                )}
                <span className="hidden sm:inline">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ===== COVER IMAGE ===== */}
        {coverImg && (
          <img
            src={`${coverImg}?w=1200&auto=format&q=80`}
            alt={post.title}
            loading="eager"
            className="mt-5 md:mt-8 w-full rounded-xl md:rounded-2xl"
          />
        )}

        {/* ===== CONTENT: Part1 → Img2 → Part2 → Img3 ... ===== */}
        {sections.map((s, i) => (
          <section key={i}>
            {s.html && (
              <div
                className={`max-w-none text-[14px] md:text-base leading-6 md:leading-7 break-words
                  text-gray-800 dark:text-gray-100
                  [&_p]:mb-3 md:[&_p]:mb-4 [&_p]:text-gray-800 dark:[&_p]:text-gray-100
                  [&_h1]:text-lg md:[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 md:[&_h1]:mt-8 [&_h1]:text-gray-900 dark:[&_h1]:text-white
                  [&_h2]:text-base md:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 md:[&_h2]:mt-8 [&_h2]:text-gray-900 dark:[&_h2]:text-white
                  [&_h3]:text-sm md:[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-5 md:[&_h3]:mt-6 [&_h3]:text-gray-900 dark:[&_h3]:text-white
                  [&_li]:text-gray-800 dark:[&_li]:text-gray-100
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 md:[&_ul]:my-4
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 md:[&_ol]:my-4 [&_li]:mb-1
                  [&_a]:text-[#F5A623] [&_a]:underline
                  [&_strong]:font-bold [&_strong]:text-gray-900 dark:[&_strong]:text-white
                  [&_img]:w-full [&_img]:rounded-xl md:[&_img]:rounded-2xl
                  ${i === 0 && !coverImg ? "mt-6 md:mt-8" : "mt-6 md:mt-10"}`}
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            )}
            {s.img && (
              <img
                src={`${s.img}?w=800&auto=format&q=70`}
                alt={`${post.title} — image ${i + 2}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="mt-4 md:mt-6 w-full rounded-xl md:rounded-2xl"
              />
            )}
          </section>
        ))}

        {/* ===== SHARE AGAIN — bottom ===== */}
        <div className="mt-6 md:mt-10 flex flex-col items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-5 md:pt-6">
          <span className="text-xs md:text-sm text-gray-400 font-semibold uppercase tracking-wide">Share this article</span>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {shareLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${s.name}`}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 ${s.bg}`}
              >
                {s.name === "WhatsApp" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                )}
                {s.name === "Facebook" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                )}
                {s.name === "Instagram" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                )}
                {s.name === "TikTok" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                )}
                <span className="hidden sm:inline">{s.name}</span>
              </a>
            ))}
          </div>
        </div>
      </article>

      {/* ===== RELATED BLOGS ===== */}
      {relBlogsFixed?.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10 md:py-12 mt-6 md:mt-8 border-t border-gray-100 dark:border-gray-800">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Articles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {relBlogsFixed.map((b: any) => (
              <BlogCard key={b._id} post={b} />
            ))}
          </div>
        </section>
      )}

      {/* ===== RELATED PRODUCTS ===== */}
      {products?.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12 md:pb-16">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-5 md:mb-6">
            Shop Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {products.map((pr: any) => (
              <Link
                key={pr._id}
                href={`/product/${pr.slug}`}
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 hover:shadow-md transition-shadow"
              >
                {pr.img && (
                  <img
                    src={`${pr.img}?w=800&auto=format&q=70`}
                    alt={pr.title}
                    loading="lazy"
                    className="aspect-square w-full object-cover rounded-xl"
                  />
                )}
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {pr.title}
                </p>
                {pr.price != null && (
                  <p className="text-[#F5A623] font-bold text-sm mt-1">Rs {pr.price}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}