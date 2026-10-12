import type { Metadata } from "next";
import { client } from "../../lib/sanityClient";
import ShopContent from "../../components/ShopContent";

export const revalidate = 60;

const BASE_URL = "https://www.autobrothers.pk";

/* ============================================================
   ✅ METADATA — dynamic: category ke hisaab se title/desc
============================================================ */
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { cat?: string; q?: string };
}): Promise<Metadata> {
  const { cat, q } = searchParams || {};

  /* Category filter ho toh uska title lao */
  let catTitle = "";
  if (cat) {
    const c: any = await client.fetch(
      `*[_type == "category" && slug.current == $cat][0]{ title }`,
      { cat }
    );
    catTitle = c?.title || "";
  }

  const title = catTitle
    ? `Used ${catTitle} in Pakistan | AutoBrothers.pk`
    : "Used Auto Parts & Car Spare Parts Online | AutoBrothers.pk";

  const description = catTitle
    ? `Buy ${catTitle} online in Pakistan — genuine quality used auto parts with all-Pakistan delivery. Best prices, quality checked, easy returns.`
    : "Shop used auto parts & car spare parts online in Pakistan — engines, catalytic converters, transmissions, ignition coils. Japan imported, quality checked, all-Pakistan delivery.";

  const canonical = cat
    ? `${BASE_URL}/shop?cat=${cat}`
    : `${BASE_URL}/shop`;

  return {
    title,
    description,
    keywords: [
      "used auto parts Pakistan",
      catTitle ? `used ${catTitle} Pakistan` : "car spare parts online",
      "used car parts online Pakistan",
      "japan imported auto parts",
      "buy auto parts Karachi",
      ...(catTitle ? [`${catTitle} price in Pakistan`] : []),
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "AutoBrothers",
      locale: "en_PK",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: { cat?: string; q?: string };
}) {
  const { cat, q } = searchParams || {};

  /* ✅ Query me used-product fields add kiye — ProductCard ke badges ke liye */
  const [prods, cats, subsCount] = await Promise.all([
    client.fetch(
      `*[_type == "product"] | order(coalesce(order, 9999) asc, _createdAt desc){
        _id, title, "slug": slug.current, price, oldPrice, condition, conditionScore,
        mileage, warranty, qualityChecked, japanImported,
        model, featured, newArrival, inStock, description,
        "subTitle": subcategory->title,
        "catTitle": category->title, "catSlug": category->slug.current,
        "img": images[0].asset->url
      }`
    ),
    client.fetch(
      `*[_type == "category"] | order(coalesce(order, 9999) asc, title asc){
        _id, title, "slug": slug.current, "img": image.asset->url,
        "productCount": count(*[_type == "product" && subcategory->parentCategory._ref == ^._id])
      }`
    ),
    Promise.resolve(0), // placeholder — Promise.all shape
  ]);

  const products = prods.map((p: any) => ({
    id: p.slug || p._id,
    title: p.title,
    price: p.price ?? "",
    oldPrice: p.oldPrice,
    image: p.img ? `${p.img}?w=800&auto=format&q=70` : "",
    category: p.catTitle || "",
    catSlug: p.catSlug || "",
    subCategory: p.subTitle || "",
    condition: p.condition,
    conditionScore: p.conditionScore,
    mileage: p.mileage,
    warranty: p.warranty,
    qualityChecked: p.qualityChecked,
    japanImported: p.japanImported,
    model: p.model,
    featured: p.featured,
    newArrival: p.newArrival,
    inStock: p.inStock,
    description: p.description || "",
  }));

  const categories = cats.map((c: any) => ({
    id: c._id,
    name: c.title,
    slug: c.slug,
    image: c.img ? `${c.img}?w=800&auto=format&q=70` : "",
    productCount: c.productCount || 0,
  }));

  /* ✅ ItemList JSON-LD — Google ko structured product list */
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Used Auto Parts",
    itemListElement: products.slice(0, 20).map((p: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE_URL}/product/${p.id}`,
      name: p.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <ShopContent
        prods={products}
        cats={categories}
        initialCat={cat || ""}
        initialQ={q || ""}
      />
    </>
  );
}