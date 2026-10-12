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

// Price string → number
function parsePrice(p?: string): number | null {
  if (!p) return null;
  const digits = p.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : null;
}

/* Condition → Score (out of 10) */
const scoreMap: Record<string, number> = { Good: 8, Average: 6, Bad: 3 };
function getConditionScore(p: any): number {
  if (typeof p?.conditionScore === "number" && p.conditionScore > 0) return p.conditionScore;
  return scoreMap[p?.condition] ?? 0;
}

/* ============================================================
   METADATA — ✅ seoTitle/seoDesc PRIORITY + naye fields keywords
============================================================ */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product: any = await client.fetch(
    `*[_type == "product" && slug.current == $slug][0]{
      title, description, price, model, condition, conditionScore,
      mileage, warranty, qualityChecked, japanImported,
      brand, partNumber, engineCode, seoTitle, seoDesc,
      "subTitle": subcategory->title,
      "img": images[0].asset->url
    }`,
    { slug: params.slug }
  );
  if (!product) return { title: "Product Not Found", robots: { index: false } };

  const score = getConditionScore(product);

  const og = product.img ? `${product.img}?w=1200&auto=format&q=80` : undefined;
  const url = `${BASE_URL}/product/${params.slug}`;

  /* ✅ SEO priority: seoDesc > description > auto-generated */
  const desc =
    product.seoDesc ||
    product.description?.slice(0, 160) ||
    `Buy ${product.title} in Pakistan${product.price ? ` — Rs ${product.price}` : ""}. ${
      product.condition ? `${product.condition} condition (${score}/10)` : ""
    }${product.mileage ? `, ${product.mileage} km` : ""} used auto part with all-Pakistan delivery.`;

  /* ✅ SEO priority: seoTitle > auto-built */
  const metaTitle =
    product.seoTitle ||
    `${product.title}${product.price ? ` — Rs ${product.price}` : " — Best Price"}${product.condition ? ` | ${product.condition} (${score}/10)` : ""}`;

  /* ✅ Keywords — ab brand + part number + engine code bhi
     (mechanics inhi se search karte hain) */
  const keywords = [
    product.title,
    `used ${product.title}`,
    /* Brand combos */
    product.brand ? `${product.brand} ${product.subTitle ?? "parts"}` : "",
    product.brand ? `used ${product.brand} parts Pakistan` : "",
    product.brand && product.subTitle ? `${product.brand} ${product.subTitle} price in Pakistan` : "",
    /* ✅ Part Number — mechanics ka search */
    product.partNumber ?? "",
    product.partNumber ? `${product.partNumber} price in Pakistan` : "",
    product.partNumber ? `${product.partNumber} original` : "",
    /* ✅ Engine Code — engine buyers ka search */
    product.engineCode ?? "",
    product.engineCode ? `${product.engineCode} engine for sale in Pakistan` : "",
    product.engineCode ? `used ${product.engineCode} engine` : "",
    product.engineCode && product.brand ? `${product.brand} ${product.engineCode}` : "",
    /* Model combos */
    product.model ? `${product.title} ${product.model}` : "",
    product.model ? `used ${product.title} for ${product.model}` : "",
    /* Generic */
    product.subTitle ?? "",
    `used ${product.subTitle ?? "auto parts"} Pakistan`,
    product.japanImported ? "japan imported auto parts Pakistan" : "",
    "used auto parts Pakistan",
    "used car parts online",
    "auto parts Karachi",
    "car accessories online",
  ].filter(Boolean);

  const ogAlt = `${product.title}${product.condition ? ` — ${product.condition} condition ${score}/10` : ""} used auto part Pakistan`;

  return {
    title: metaTitle,
    description: desc,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title: product.seoTitle || product.title,
      description: desc,
      url,
      siteName: SITE_NAME,
      locale: "en_PK",
      type: "website",
      images: og ? [{ url: og, width: 1200, height: 630, alt: ogAlt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle || product.title,
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
      _id, title, "slug": slug.current, price, oldPrice, condition, conditionScore,
      inStock, featured, newArrival, mileage, warranty, qualityChecked, japanImported,
      brand, partNumber, engineCode, seoTitle, seoDesc,
      description, model, "subRef": subcategory._ref,
      "subTitle": subcategory->title, "subSlug": subcategory->slug.current,
      "images": images[]{ "url": asset->url, "alt": coalesce(alt, ^.title) }
    }`,
    { slug: params.slug }
  );
  if (!product) notFound();

  const priceNum = parsePrice(product.price);
  const score = getConditionScore(product);

  const scoreColor =
    score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-red-500";
  const scorePercent = Math.min(score * 10, 100);

  // Related products
  let related: any[] = await client
    .fetch(
      `*[_type == "product" && defined(slug.current) && slug.current != $slug && subcategory._ref == $subRef][0...4]{ _id, title, "slug": slug.current, price, condition, conditionScore, "img": images[0].asset->url, "alt": coalesce(images[0].alt, title) }`,
      { slug: params.slug, subRef: product.subRef }
    )
    .catch(() => []);
  if (!related?.length) {
    related = await client
      .fetch(
        `*[_type == "product" && defined(slug.current) && slug.current != $slug] | order(_createdAt desc) [0...4]{ _id, title, "slug": slug.current, price, condition, conditionScore, "img": images[0].asset->url, "alt": coalesce(images[0].alt, title) }`,
        { slug: params.slug }
      )
      .catch(() => []);
  }

  /* ============================================================
     PRODUCT JSON-LD — ✅ brand REAL brand, partNumber as mpn
  ============================================================ */
  const conditionMap: Record<string, string> = {
    Good: "https://schema.org/UsedCondition",
    Average: "https://schema.org/UsedCondition",
    Bad: "https://schema.org/DamagedCondition",
  };

  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const additionalProps: any[] = [];
  if (product.brand) {
    additionalProps.push({ "@type": "PropertyValue", name: "Brand", value: product.brand });
  }
  if (product.partNumber) {
    additionalProps.push({ "@type": "PropertyValue", name: "OEM Part Number", value: product.partNumber });
  }
  if (product.engineCode) {
    additionalProps.push({ "@type": "PropertyValue", name: "Compatible Engine", value: product.engineCode });
  }
  if (product.model) {
    additionalProps.push({ "@type": "PropertyValue", name: "Compatible Models", value: product.model });
  }
  if (product.condition) {
    additionalProps.push({
      "@type": "PropertyValue",
      name: "Condition",
      value: `${product.condition} (${score}/10)`,
    });
  }
  if (product.mileage) {
    additionalProps.push({ "@type": "PropertyValue", name: "Mileage", value: `${product.mileage} km` });
  }
  if (product.warranty) {
    additionalProps.push({ "@type": "PropertyValue", name: "Warranty", value: `${product.warranty} days` });
  }
  if (product.japanImported) {
    additionalProps.push({ "@type": "PropertyValue", name: "Origin", value: "Japan Imported" });
  }

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.seoDesc ||
      product.description ||
      `${product.title} — genuine auto part available at ${SITE_NAME}. All Pakistan delivery.`,
    image: product.images?.map((im: any) => `${im.url}?w=1200&auto=format&q=80`),
    sku: product._id,
    /* ✅ mpn = Manufacturer Part Number — ab REAL part number
       (pehle slug tha jo galat tha) */
    mpn: product.partNumber || product.slug,
    /* ✅ brand = ACTUAL car brand (Toyota/Honda) — pehle SITE_NAME tha */
    brand: { "@type": "Brand", name: product.brand || SITE_NAME },
    category: product.subTitle || undefined,
    additionalProperty: additionalProps.length > 0 ? additionalProps : undefined,
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

  /* ✅ WhatsApp text me brand + part number + engine code bhi */
  const waText = encodeURIComponent(
    `Assalam o Alaikum! Mujhe ye part chahiye:\n\n*${product.title}*${product.brand ? `\nBrand: ${product.brand}` : ""}${product.partNumber ? `\nPart No: ${product.partNumber}` : ""}${product.engineCode ? `\nEngine: ${product.engineCode}` : ""}\n${product.price ? `Price: Rs ${product.price}\n` : ""}Condition: ${product.condition} (${score}/10)${product.mileage ? `\nMileage: ${product.mileage} km` : ""}${product.model ? `\nModel: ${product.model}` : ""}\n\nLink: ${BASE_URL}/product/${product.slug}`
  );

  const condColors: Record<string, string> = {
    Good: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    Average: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    Bad: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  /* ✅ Specs grid — naye fields included */
  const hasSpecs = product.model || product.mileage || product.warranty || product.japanImported || product.brand || product.partNumber || product.engineCode;

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
          <div className="flex gap-2 flex-wrap mb-3 items-center">
            {product.featured && (
              <span className="text-[11px] font-bold uppercase tracking-widest bg-[#F5A623] text-black px-3 py-1 rounded-full">★ Featured</span>
            )}
            {product.newArrival && (
              <span className="text-[11px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-3 py-1 rounded-full">New Arrival</span>
            )}
            {product.condition && (
              <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${condColors[product.condition] || ""}`}>
                {product.condition}
              </span>
            )}
            {product.japanImported && (
              <span className="text-[11px] font-bold uppercase tracking-widest bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-3 py-1 rounded-full">
                🇯🇵 Japan Import
              </span>
            )}
          </div>

          {/* ✅ BRAND line — title ke upar (jaise Amazon me hota hai) */}
          {product.brand && (
            <p className="text-xs font-bold uppercase tracking-widest text-[#F5A623] mb-1">
              {product.brand}
            </p>
          )}

          <h1 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900 dark:text-white">{product.title}</h1>

          {/* ✅ PART NUMBER + ENGINE CODE — title ke neeche prominent
              (mechanics sabse pehle yehi dekhte hain) */}
          {(product.partNumber || product.engineCode) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.partNumber && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg">
                  🔧 P/N: {product.partNumber}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(product.partNumber)}
                    title="Copy part number"
                    className="text-gray-400 hover:text-[#F5A623] transition"
                  >📋</button>
                </span>
              )}
              {product.engineCode && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg">
                  ⚙️ Engine: {product.engineCode}
                </span>
              )}
            </div>
          )}

          {product.model && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Fits: <span className="font-semibold text-gray-700 dark:text-gray-300">{product.model}</span>
            </p>
          )}

          {/* Price + Stock */}
          <div className="mt-5 flex items-center gap-4 flex-wrap">
            <div className="flex items-baseline gap-2">
              {product.price && (
                <p className="text-3xl font-extrabold text-[#F5A623]">Rs {product.price}</p>
              )}
              {product.oldPrice && (
                <p className="text-base text-gray-400 line-through">Rs {product.oldPrice}</p>
              )}
            </div>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              product.inStock
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
            }`}>
              {product.inStock ? "✓ In Stock" : "✗ Out of Stock"}
            </span>
          </div>

          {/* CONDITION SCORE — visual X/10 with progress bar */}
          {score > 0 && (
            <div className="mt-5 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Condition Score
                </p>
                <span className={`text-white text-sm font-black px-2.5 py-0.5 rounded-lg ${scoreColor}`}>
                  {score}/10
                </span>
              </div>
              <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor} transition-all`} style={{ width: `${scorePercent}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
              {product.condition && (
                <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                  Rated <strong>{product.condition}</strong> by our inspection team{product.qualityChecked ? " — fully tested before listing" : ""}.
                </p>
              )}
            </div>
          )}

          {/* ✅ USED PRODUCT SPECS — Brand + Part No + Engine Code added */}
          {hasSpecs && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {product.brand && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-lg">🏷️</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">Brand</p>
                    <p className="font-bold text-gray-900 dark:text-white">{product.brand}</p>
                  </div>
                </div>
              )}
              {product.partNumber && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-lg">🔧</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">Part Number</p>
                    <p className="font-bold text-gray-900 dark:text-white font-mono text-[11px]">{product.partNumber}</p>
                  </div>
                </div>
              )}
              {product.engineCode && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-lg">⚙️</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">Engine Code</p>
                    <p className="font-bold text-gray-900 dark:text-white">{product.engineCode}</p>
                  </div>
                </div>
              )}
              {product.mileage && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-lg">🛣️</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">Mileage</p>
                    <p className="font-bold text-gray-900 dark:text-white">{product.mileage} km</p>
                  </div>
                </div>
              )}
              {product.warranty && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">Warranty</p>
                    <p className="font-bold text-gray-900 dark:text-white">{product.warranty} days</p>
                  </div>
                </div>
              )}
              {product.model && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-lg">🚗</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">Fits Models</p>
                    <p className="font-bold text-gray-900 dark:text-white truncate">{product.model}</p>
                  </div>
                </div>
              )}
              {product.subTitle && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                  <span className="text-lg">📦</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">Category</p>
                    <p className="font-bold text-gray-900 dark:text-white truncate">{product.subTitle}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {product.description ? (
            <article className="mt-5 text-gray-600 dark:text-gray-300 leading-7 whitespace-pre-line">
              {product.description}
            </article>
          ) : (
            <p className="mt-5 text-gray-500 dark:text-gray-400 leading-7">
              {product.title} — {product.condition} condition ({score}/10){product.mileage ? `, ${product.mileage} km driven` : ""}{product.model ? `, fits ${product.model}` : ""}.
              Genuine quality checked used part with all-Pakistan delivery. Order via WhatsApp.
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
            {related.map((pr: any) => {
              const relScore = getConditionScore(pr);
              return (
                <Link key={pr._id} href={`/product/${pr.slug}`}
                  className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 hover:shadow-md transition-shadow relative">
                  {relScore > 0 && (
                    <span className={`absolute top-5 left-5 text-[9px] font-black text-white px-1.5 py-0.5 rounded ${relScore >= 8 ? "bg-green-500" : relScore >= 6 ? "bg-amber-500" : "bg-red-500"}`}>
                      {relScore}/10
                    </span>
                  )}
                  {pr.img && (
                    <img src={`${pr.img}?w=600&auto=format&q=70`} alt={pr.alt || pr.title}
                      loading="lazy" width={600} height={600}
                      className="aspect-square w-full object-cover rounded-xl" />
                  )}
                  <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{pr.title}</p>
                  {pr.price && <p className="text-[#F5A623] font-bold text-sm mt-1">Rs {pr.price}</p>}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}