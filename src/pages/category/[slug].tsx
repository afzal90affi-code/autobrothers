import { useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { client, urlFor } from "../../lib/sanityadmin"
import { ShoppingCart, MessageCircle, ArrowLeft, Heart, Star, Zap, Check, Phone, Menu, X } from "lucide-react"
import { useCart } from "../../context/CartContext"

const WA = "923222806245"
const SITE_URL = "https://autobrothers.pk"
const LOGO_URL = "https://z-cdn-media.chatglm.cn/files/38af05f1-1af5-464b-875c-700c76d223f0.png?auth_key=1878522932-2701be125ca248b1940a1fc54256fb02-0-136358651fbb20556043afd5c278ea32"

const NAV = [
  { l: "Home", h: "/" },
  { l: "Products", h: "/#products" },
  { l: "Categories", h: "/#categories" },
  { l: "About", h: "/#about" },
]

const waLink = (name: string, price?: string, url?: string) => {
  const text = `Salam! AutoBrothers mein "${name}"${price ? ` (${price})` : ""} ki detail chahiye.\n\nLink: ${url || ""}`
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
}

const condBadge = (c: string) => {
  if (c === "Good") return { class: "bg-emerald-500/90 text-white", icon: "OK", label: "Good" }
  if (c === "Average") return { class: "bg-amber-500/90 text-white", icon: "AVG", label: "Average" }
  return { class: "bg-rose-500/90 text-white", icon: "USED", label: c || "Used" }
}

export async function getStaticPaths() {
  const paths = await client.fetch(`*[_type == "category" && defined(slug.current)][].slug.current`)
  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: "blocking"
  }
}

export async function getStaticProps({ params }: any) {
  const catQuery = `*[_type == "category" && slug.current == $slug][0]{ title, "image": image.asset->url }`
  const subcatsQuery = `*[_type == "subcategory" && parentCategory->slug.current == $slug]{ _id, title, "slug": slug.current, "image": image.asset->url }`
  const prodsQuery = `*[_type == "product" && subcategory->parentCategory->slug.current == $slug] | order(_createdAt desc){
    "id": _id, title, price, condition, inStock, featured, newArrival,
    "image": images[0].asset->url,
    "subCatTitle": subcategory->title
  }`

  const category = await client.fetch(catQuery, { slug: params.slug })
  const subcategories = await client.fetch(subcatsQuery, { slug: params.slug })
  const products = await client.fetch(prodsQuery, { slug: params.slug })

  return {
    props: { category, subcategories, products },
    revalidate: 60,
  }
}

export default function CategoryPage({ category, subcategories, products }: any) {
  const { addToCart, totalItems } = useCart()
  const [wishlist, setWishlist] = useState<string[]>([])
  const [menu, setMenu] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  if (!category) {
    return <div className="min-h-screen bg-[#0A1929] text-white flex items-center justify-center">Loading...</div>
  }

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <>
      <Head>
        <title>{category.title} | AutoBrothers</title>
      </Head>

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A1929]/95 backdrop-blur-md border-b border-[#1E3A52]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Logo" className="h-10 w-auto rounded" />
            <span className="hidden sm:block font-extrabold text-sm">
              Auto<span className="text-[#F5A623]">Brothers</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV.map((n) => (
              <a key={n.l} href={n.h} className="text-sm text-gray-400 hover:text-[#F5A623] transition-colors">
                {n.l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a href="tel:03222806245" className="hidden sm:flex items-center gap-1 text-[11px] text-[#F5A623] bg-[#F5A623]/10 px-3 py-1.5 rounded-lg border border-[#F5A623]/20">
              <Phone size={12} /> 0322-2806245
            </a>
            <Link href="/bucket" className="relative w-9 h-9 rounded-lg bg-[#13293D] border border-[#1E3A52] flex items-center justify-center text-gray-400 hover:text-[#F5A623]">
              <ShoppingCart size={16} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F5A623] text-[#0A1929] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <button onClick={() => setMenu(!menu)} className="md:hidden w-9 h-9 rounded-lg bg-[#13293D] border border-[#1E3A52] flex items-center justify-center text-gray-400">
              {menu ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="md:hidden bg-[#0A1929] border-t border-[#1E3A52] px-4 py-3 space-y-1">
            {NAV.map((n) => (
              <a key={n.l} href={n.h} onClick={() => setMenu(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-[#F5A623]">
                {n.l}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="min-h-screen bg-[#0A1929] text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="mb-8">
            <Link href="/#categories" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#F5A623] mb-4 transition-colors">
              <ArrowLeft size={16} /> Back to Categories
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-[#F5A623] to-transparent rounded-full"></div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{category.title}</h1>
            </div>
            <p className="text-gray-500 mt-2 text-sm">Premium quality auto parts verified and tested</p>
          </div>

          {/* Sub Categories */}
          {subcategories.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-4 text-gray-300 flex items-center gap-2">
                <span className="h-4 w-1 bg-[#F5A623] rounded-full"></span>
                Browse Sub Categories
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {subcategories.map((sub: any) => (
                  <div key={sub._id} className="flex-none w-[170px] bg-gradient-to-br from-[#13293D] to-[#0D1F30] border border-[#1E3A52] rounded-2xl p-5 text-center hover:border-[#F5A623]/60 hover:shadow-lg hover:shadow-[#F5A623]/10 transition-all duration-300 group cursor-pointer">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-[#0A1929] flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                      {sub.image ? (
                        <img src={sub.image} alt={sub.title} className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-3xl">Box</div>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-gray-300 group-hover:text-[#F5A623] transition-colors">{sub.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-300 flex items-center gap-2">
                <span className="h-4 w-1 bg-[#F5A623] rounded-full"></span>
                Products in {category.title}
              </h2>
              <span className="text-sm text-gray-500">{products.length} items</span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20 bg-gradient-to-br from-[#13293D] to-[#0D1F30] rounded-2xl border border-[#1E3A52] text-gray-500">
                <div className="text-5xl mb-4 opacity-50">Empty</div>
                <p className="text-lg">No products in this category yet.</p>
                <p className="text-sm mt-1">Check back soon we are adding new inventory daily</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p: any) => {
                  const cond = condBadge(p.condition)
                  const isWishlisted = wishlist.includes(p.id)
                  return (
                    <div
                      key={p.id}
                      className="group relative bg-[#13293D] border border-[#1E3A52] rounded-xl overflow-hidden hover:border-[#F5A623]/50 hover:shadow-xl hover:shadow-[#F5A623]/10 hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Image Section - 85% of card */}
                      <Link href={`/product/${p.id}`}>
                        <div className="relative aspect-[3/4] overflow-hidden bg-[#0D1F30]">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1929]/80 via-transparent to-transparent z-10 pointer-events-none"></div>

                          <img
                            src={p.image || "https://picsum.photos/seed/d/400/500"}
                            alt={p.title}
                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                          />

                          {/* Featured Badge */}
                          {p.featured && (
                            <div className="absolute top-2 right-2 z-20 bg-gradient-to-r from-[#F5A623] to-[#FFB94D] text-[#0A1929] text-[9px] font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                              <Star size={8} fill="currentColor" /> FEATURED
                            </div>
                          )}

                          {/* Wishlist Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleWishlist(p.id)
                            }}
                            className="absolute top-2 left-2 z-20 w-7 h-7 rounded-full bg-[#0A1929]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[#0A1929] transition-all"
                            aria-label="Add to wishlist"
                          >
                            <Heart
                              size={13}
                              className={isWishlisted ? "text-rose-500 fill-rose-500" : "text-gray-400 hover:text-rose-400"}
                            />
                          </button>

                          {/* Condition Badge */}
                          {p.condition && (
                            <span
                              className={`absolute ${p.featured ? "top-11 right-2" : "top-2 right-2"} z-20 text-[9px] font-bold px-2 py-1 rounded-md ${cond.class} shadow-lg`}
                            >
                              {cond.icon} {cond.label}
                            </span>
                          )}

                          {/* New Arrival Badge */}
                          {p.newArrival && p.inStock !== false && (
                            <div className="absolute bottom-2 left-2 z-20 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
                              <Zap size={8} fill="currentColor" /> NEW
                            </div>
                          )}

                          {/* Price Badge */}
                          <div className="absolute bottom-2 right-2 z-20 bg-[#0A1929]/90 backdrop-blur-sm px-2 py-1 rounded-md border border-[#F5A623]/30">
                            <span className="text-[9px] text-gray-400">PKR </span>
                            <span className="text-xs font-extrabold text-[#F5A623]">{p.price || "Call"}</span>
                          </div>

                          {/* Out of Stock Overlay */}
                          {p.inStock === false && (
                            <div className="absolute inset-0 z-30 bg-[#0A1929]/70 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xl">
                                OUT OF STOCK
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Action Buttons Section - 15% of card */}
                      <div className="p-2 flex gap-1.5">
                        <button
                          disabled={p.inStock === false}
                          onClick={() => addToCart({ id: p.id, title: p.title, price: p.price || "", image: p.image || "", quantity: 1 })}
                          className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-[#F5A623] to-[#FFB94D] hover:from-[#FFB94D] hover:to-[#F5A623] disabled:opacity-40 disabled:cursor-not-allowed text-[#0A1929] py-2 rounded-lg text-[11px] font-bold transition-all shadow-md shadow-[#F5A623]/20"
                        >
                          <ShoppingCart size={12} /> Cart
                        </button>
                        <button
                          onClick={() => window.open(waLink(p.title, p.price, `${SITE_URL}/product/${p.id}`), "_blank")}
                          className="w-9 h-9 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center transition-all"
                          aria-label="WhatsApp inquiry"
                        >
                          <MessageCircle size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* WhatsApp FAB */}
      <a
        href={waLink(category.title)}
        target="_blank"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"
      >
        <MessageCircle size={26} />
      </a>
    </>
  )
}