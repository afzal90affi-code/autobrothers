import { createElement } from "react";

// ⚙️ Apna domain yahan set karo — sab jagah yehi use hoga
export const SITE = {
  name: "AutoBrothers.pk",
  url: "https://autobrothers.pk", // ← apna real domain dalo
  description:
    "Premium car accessories & genuine auto parts shop in Pakistan. Engines, catalytic converters, transmissions + expert car care blog.",
  twitter: "@autobrothers",
  currency: "PKR",
};

/* ---------- Organization + WebSite (har page pe) ---------- */
export function orgJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#org`,
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        publisher: { "@id": `${SITE.url}/#org` },
        // ✅ Sitelinks search box (Google result mein search box dikhta hai)
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE.url}/products?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

/* ---------- Product (product detail page pe) ---------- */
export function productJsonLd(p: {
  title: string; description?: string; image?: string; price?: string;
  slug: string; condition?: string; model?: string; inStock?: boolean;
  category?: string;
}) {
  const conditionMap: Record<string, string> = {
    Good: "https://schema.org/UsedCondition",
    Average: "https://schema.org/UsedCondition",
    Bad: "https://schema.org/DamagedCondition",
  };
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description || `${p.title} — ${SITE.name} se order karein. All Pakistan delivery.`,
    image: p.image ? [p.image] : undefined,
    category: p.category,
    sku: p.slug,
    itemCondition: conditionMap[p.condition ?? ""] ?? "https://schema.org/UsedCondition",
    // ✅ Model compatibility — AI engines ko samajh aata hai
    additionalProperty: p.model
      ? [{ "@type": "PropertyValue", name: "Compatible Models", value: p.model }]
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/product/${p.slug}`,
      priceCurrency: SITE.currency,
      price: p.price?.replace(/[^0-9.]/g, "") || "0",
      availability: p.inStock === false
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE.name },
    },
  };
}

/* ---------- Article (blog detail pe) ---------- */
export function articleJsonLd(b: {
  title: string; description?: string; image?: string;
  slug: string; publishedAt: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: b.title,
    description: b.description,
    image: b.image ? [b.image] : undefined,
    datePublished: b.publishedAt,
    dateModified: b.publishedAt,
    author: { "@type": "Organization", name: SITE.name },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` },
    },
    mainEntityOfPage: `${SITE.url}/blog/${b.slug}`,
  };
}

/* ---------- Breadcrumb (product/blog detail pe) ---------- */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/* ---------- Page mein JSON-LD inject karne ka component ---------- */
export function JsonLd({ data }: { data: object }) {
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  });
}