import type { MetadataRoute } from "next";
import { client } from "../lib/sanityClient";
import { SITE } from "../lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products: { slug: string; _createdAt: string }[] = await client.fetch(
    `*[_type == "product"]{ "slug": slug.current, _createdAt }`
  ).catch(() => []);
  const blogs: { slug: string; _updatedAt: string }[] = await client.fetch(
    `*[_type == "post"]{ "slug": slug.current, _updatedAt }`
  ).catch(() => []);

  return [
    { url: SITE.url, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/new-cars`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/about-us`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.url}/contact-us`, changeFrequency: "monthly", priority: 0.5 },
    ...products.map((p) => ({
      url: `${SITE.url}/product/${p.slug}`,
      lastModified: new Date(p._createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...blogs.map((b) => ({
      url: `${SITE.url}/blog/${b.slug}`,
      lastModified: new Date(b._updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}