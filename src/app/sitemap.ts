import type { MetadataRoute } from "next";
import { client } from "../lib/sanityClient";

const BASE = "https://www.autobrothers.pk";

type SlugDoc = { slug: string; _updatedAt: string };

async function fetchSlugs(query: string): Promise<SlugDoc[]> {
  try {
    const docs = (await client.fetch(query)) as Array<{
      slug?: string | null;
      _updatedAt?: string | null;
    }>;
    if (!Array.isArray(docs)) return [];
    const seen: string[] = [];
    const out: SlugDoc[] = [];
    for (const d of docs) {
      if (!d || !d.slug) continue;
      if (seen.indexOf(d.slug) !== -1) continue;
      seen.push(d.slug);
      out.push({
        slug: d.slug,
        _updatedAt: d._updatedAt || new Date().toISOString(),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, cats] = await Promise.all([
    fetchSlugs(
      `*[_type == "product" && defined(slug.current)]{ "slug": slug.current, "_updatedAt": _updatedAt }`
    ),
    fetchSlugs(
      `*[_type in ["post", "blog", "blogPost"] && defined(slug.current)]{ "slug": slug.current, "_updatedAt": _updatedAt }`
    ),
    // 3-level hierarchy: mainCategory + category + subcategory — teeno
    // ke /products?cat=<slug> URLs sitemap me jayenge
    fetchSlugs(
      `*[_type in ["mainCategory", "category", "subcategory"] && defined(slug.current)]{ "slug": slug.current, "_updatedAt": _updatedAt }`
    ),
  ]);

  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/new-cars`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact-us`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/product/${p.slug}`,
    lastModified: p._updatedAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const postUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p._updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const catUrls: MetadataRoute.Sitemap = cats.map((c) => ({
    url: `${BASE}/products?cat=${encodeURIComponent(c.slug)}`,
    lastModified: c._updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productUrls, ...postUrls, ...catUrls];
}

export const revalidate = 3600;