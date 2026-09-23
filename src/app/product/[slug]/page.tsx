import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { client } from "../../../lib/sanityClient";
import ProductGallery from "../../../components/ProductGallery";
import AddToCartButton from "../../../components/AddToCartButton";

export const revalidate = 60;

const BASE_URL = "https://autobrothers.pk";
const SITE_NAME = "AutoBrothers";
const WHATSAPP_NUMBER = "923222806245"; // APNA NUMBER (92 + number, + nahi)

// Price string → number ("25,000" → 25000, "Contact for Price" → null)
function parsePrice(p?: string): number | null {
  if (!p) return null;
  const digits = p.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : null;
}

/* ============================================================
   METADATA — full SEO (OG + Twitter + robots + keywords)
   ============================================================ */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product: any = await client.fetch(
    `*[_type == "product" && slug.current == $slug][0]{
      title, description, price, model, condition,
      "subTitle": subcategory->title,
      "img": images[0].asset->url
    }`,
    { slug: params.slug }
  );
  if (!product) return { title: "Product Not Found", robots: { index: false } };

  const og = product.img ? `${product.img}?w=1200&auto=format&q=80` : undefined;
  const url = `${BASE_URL}/product/${params.slug}`;
  const desc =
    product.description?.slice(0, 160) ||
    `Buy ${product.title} in Pakistan${product.price ? ` — Rs ${product.price}` : ""}. Genuine quality auto parts with fast all-Pakistan delivery.`;

  return {
    title: `${product.title}${product.price ? ` — Rs ${product.price}` : " — Best Price"}`,
    description: desc,
    keywords: [
      product.title,
      product.model ? `${product.title} ${product.model}` : "",
      product.subTitle ?? "",
      "auto parts Pakistan",
      "car accessories online",
    ].filter(Boolean),
    alternates: { canonical: url },
    openGraph: {
      title: product.title,
      description: desc,
      url,
      siteName: SITE_NAME,
      locale: "en_PK",
      type: "website",
      images: og ? [{ url: og, width: 1200, height: 630, alt: product.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: desc,
      images: og ? [og] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product: any = await client.fetch(
    `*[_type == "product" && slug.current == $slug][0]{
      _id, title, "slug": slug.current, price, condition, inStock, featured, newArrival,
      description, model, "subRef": subcategory._ref,
      "subTitle": subcategory->title, "subSlug": subcategory->slug.current,
      "images": images[]{ "url": asset->url, "alt": coalesce(alt, ^title) }
    }`,
    { slug: params.slug }
  );
  if (!product) notFound();

  const priceNum = parsePrice(product.price);

  // Related: same subcategory pehle, na milein to latest
  let related: any[] = await client
    .fetch(
      `*[_type == "product" && defined(slug.current) && slug.current != $slug && subcategory._ref == $subRef][0...4]{ _id, title, "slug": slug.current, price, condition, "img": images[0].asset->url, "alt": coalesce(images[0].alt, title) }`,
      { slug: params.slug, subRef: product.subRef }
    )
    .catch(() => []);
  if (!related?.length) {
    related = await client
      .fetch(
        `*[_type == "product" && defined(slug.current) && slug.current != $slug] | order(_createdAt desc) [0...4]{ _id, title, "slug": slug.current, price, condition, "img": images[0].asset->url, "alt": coalesce(images[0].alt, title) }`,
        { slug: params.slug }
      )
      .catch(() => []);
  }

  /* ============================================================
     PRODUCT JSON-LD — ENHANCED (Google Shopping / AI ready)
     ============================================================ */
  const conditionMap: Record<string, string> = {
    Good: "https://schema.org/UsedCondition",
    Average: "https://schema.org/UsedCondition",
    Bad: "https://schema.org/DamagedCondition",
  };

  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.description ||
      `${product.title} — genuine auto part available at ${SITE_NAME}. All Pakistan delivery.`,
    image: product.images?.map((im: any) => `${im.url}?w=1200&auto=format&q=80`),
    sku: product._id,
    mpn: product.slug,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: product.subTitle || undefined,
    additionalProperty: product.model
      ? [
          {
            "@type": "PropertyValue",
            name: "Compatible Models",
            value: product.model,
          },
          {
            "@type": "PropertyValue",
            name: "Condition",
            value: product.condition,
          },
        ]
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/product/${product.slug}`,
      priceCurrency: "PKR",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: conditionMap[product.condition] ?? "https://schema.org/UsedCondition",
      priceValidUntil,
      seller: { "@type": "Organization", name: SITE_NAME, url: BASE_URL },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PK",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "PKR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "PK" },
      },
    },
  };
  if (priceNum) schema.offers.price = priceNum;

  /* ============================================================
     BREADCRUMB JSON-LD
     ============================================================ */
  const breadcrumbItems: { name: string; item: string }[] = [
    { name: "Home", item: BASE_URL },
    { name: "Shop", item: `${BASE_URL}/products` },
  ];
  if (product.subTitle && product.subSlug) {
    breadcrumbItems.push({
      name: product.subTitle,
      item: `${BASE_URL}/products?cat=${product.subSlug}`,
    });
  }
  breadcrumbItems.push({ name: product.title, item: `${BASE_URL}/product/${product.slug}` });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };

  const waText = encodeURIComponent(
    `Assalam o Alaikum! Mujhe ye part chahiye:\n\n*${product.title}*\n${product.price ? `Price: Rs ${product.price}\n` : ""}Condition: ${product.condition}${product.model ? `\nModel: ${product.model}` : ""}\n\nLink: ${BASE_URL}/product/${product.slug}`
  );

  const condColors: Record<string, string> = {
    Good: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    Average: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    Bad: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumbs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <nav aria-label="Breadcrumb" className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[#F5A623]">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#F5A623]">Shop</Link>
          {product.subTitle && (
            <>
              <span>/</span>
              <Link href={`/products?cat=${product.subSlug}`} className="hover:text-[#F5A623]">{product.subTitle}</Link>
            </>
          )}
        </nav>
      </div>

      {/* MAIN: Gallery + Info */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          {/* Badges */}
          <div className="flex gap-2 flex-wrap mb-3">
            {product.featured && (
              <span className="text-[11px] font-bold uppercase tracking-widest bg-[#F5A623] text-black px-3 py-1 rounded-full">★ Featured</span>
            )}
            {product.newArrival && (
              <span className="text-[11px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-3 py-1 rounded-full">New Arrival</span>
            )}
            <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${condColors[product.condition] || ""}`}>
              Condition: {product.condition}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900 dark:text-white">{product.title}</h1>

          {product.model && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Fits: <span className="font-semibold text-gray-700 dark:text-gray-300">{product.model}</span>
            </p>
          )}

          {/* Price + Stock */}
          <div className="mt-5 flex items-center gap-4">
            {product.price && (
              <p className="text-3xl font-extrabold text-[#F5A623]">Rs {product.price}</p>
            )}
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              product.inStock
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
            }`}>
              {product.inStock ? "✓ In Stock" : "✗ Out of Stock"}
            </span>
          </div>

          {/* Description */}
          {product.description ? (
            <article className="mt-5 text-gray-600 dark:text-gray-300 leading-7 whitespace-pre-line">
              {product.description}
            </article>
          ) : (
            <p className="mt-5 text-gray-500 dark:text-gray-400 leading-7">
              {product.title} — {product.condition} condition{product.model ? `, fits ${product.model}` : ""}.
              Genuine quality checked part with all-Pakistan delivery. Order via WhatsApp or call.
            </p>
          )}

          {/* ADD TO CART */}
          {product.inStock && priceNum && (
            <AddToCartButton
              product={{
                id: product.slug,
                title: product.title,
                price: product.price,
                image: product.images?.[0]?.url || "",
                link: `/product/${product.slug}`,
                condition: product.condition,
                description: product.description,
              }}
            />
          )}

          {/* CTA Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition"
            >
              Order on WhatsApp
            </a>
            {product.inStock && (
              <a
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="flex-1 text-center border-2 border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623] hover:text-black font-bold py-3.5 rounded-xl transition"
              >
                Call to Order
              </a>
            )}
          </div>

          {/* Trust points */}
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl py-3">✅ Quality Checked</div>
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl py-3">🚚 All Pakistan Delivery</div>
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl py-3">🔄 Easy Return</div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related?.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((pr: any) => (
              <Link key={pr._id} href={`/product/${pr.slug}`}
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 hover:shadow-md transition-shadow">
                {pr.img && (
                  <img src={`${pr.img}?w=600&auto=format&q=70`} alt={pr.alt || pr.title}
                    loading="lazy" className="aspect-square w-full object-cover rounded-xl" />
                )}
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{pr.title}</p>
                {pr.price && <p className="text-[#F5A623] font-bold text-sm mt-1">Rs {pr.price}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}