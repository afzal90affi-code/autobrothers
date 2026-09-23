import { client } from "../../lib/sanityClient";
import ShopContent from "../../components/ShopContent";


export const revalidate = 60;
export const metadata = { title: "Shop Auto Parts | AutoBrothers.pk" };

export default async function ShopPage({ searchParams }: { searchParams?: { cat?: string; q?: string } }) {
  const { cat, q } = searchParams || {};

  const [prods, cats] = await Promise.all([
    client.fetch(`*[_type == "product"] | order(coalesce(order, 9999) asc, _createdAt desc){
      _id, title, "slug": slug.current, price, oldPrice, condition, featured,
      "newArrival": newArrival, "inStock": inStock, description,
      "catTitle": category->title, "catSlug": category->slug.current, "img": images[0].asset->url
    }`),
    client.fetch(`*[_type == "category"] | order(coalesce(order, 9999) asc, title asc){
      _id, title, "slug": slug.current, "img": image.asset->url
    }`),
  ]);

  /* HomeContent jaisa shape — client component same kaam karega */
  const products = prods.map((p: any) => ({
    id: p.slug || p._id,
    title: p.title,
    price: p.price ?? "",
    oldPrice: p.oldPrice,
    image: p.img ? `${p.img}?w=800&auto=format&q=70` : "",
    category: p.catTitle || "",
    catSlug: p.catSlug || "",
    condition: p.condition,
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
  }));

  return (
    <ShopContent
      prods={products}
      cats={categories}
      initialCat={cat || ""}
      initialQ={q || ""}
    />
  );
}