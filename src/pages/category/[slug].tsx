import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { client, urlFor } from '../../lib/sanityadmin'
import { ShoppingCart, Eye, MessageCircle, ArrowLeft } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const WA = '923222806245'
const SITE_URL = 'https://autobrothers.pk'

const waLink = (name: string, price?: string, url?: string) => {
  const text = `Salam! AutoBrothers mein "${name}"${price ? ` (${price})` : ''} ki detail chahiye.\n\n🔗 Link: ${url || ''}`
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
}

const condBadge = (c: string) => {
  if (c === 'Good') return 'bg-green-500/20 text-green-400'
  if (c === 'Average') return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-red-500/20 text-red-400'
}

export async function getStaticPaths() {
  const paths = await client.fetch(`*[_type == "category" && defined(slug.current)][].slug.current`)
  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: 'blocking'
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
  const { addToCart } = useCart()

  if (!category) return <div className="min-h-screen bg-[#0A1929] text-white flex items-center justify-center">Loading...</div>

  return (
    <>
      <Head>
        <title>{category.title} | AutoBrothers</title>
      </Head>

      <div className="min-h-screen bg-[#0A1929] text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Back Button & Header */}
          <div className="mb-8">
            <Link href="/#categories" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#F5A623] mb-4 transition-colors">
              <ArrowLeft size={16} /> Back to Categories
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold">{category.title}</h1>
          </div>

          {/* Sub Categories */}
          {subcategories.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-4 text-gray-300">Browse Sub Categories</h2>
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {subcategories.map((sub: any) => (
                  <div key={sub._id} className="flex-none w-[160px] bg-[#13293D] border border-[#1E3A52] rounded-xl p-4 text-center hover:border-[#F5A623]/50 transition-all">
                    {sub.image ? <img src={sub.image} alt={sub.title} className="w-16 h-16 object-contain mx-auto mb-2" /> : <div className="text-3xl mb-2">📦</div>}
                    <h4 className="text-xs font-semibold text-gray-300">{sub.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-300">Products in {category.title}</h2>
            {products.length === 0 ? (
              <div className="text-center py-20 bg-[#13293D] rounded-2xl border border-[#1E3A52] text-gray-500">
                No products in this category yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p: any) => (
                  <div key={p.id} className="bg-[#13293D] border border-[#1E3A52] rounded-xl overflow-hidden hover:border-[#F5A623]/40 hover:-translate-y-1 transition-all duration-300 group">
                    <Link href={`/product/${p.id}`}>
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#0D1F30]">
                        <img src={p.image || 'https://picsum.photos/seed/d/400/300'} alt={p.title} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                        {p.condition && <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md ${condBadge(p.condition)}`}>{p.condition}</span>}
                        {p.inStock === false && <span className="absolute top-2 right-2 bg-red-500/90 text-[9px] font-bold text-white px-2 py-0.5 rounded-md">Out of Stock</span>}
                        {p.newArrival && <span className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/80 text-white">🆕 New</span>}
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link href={`/product/${p.id}`}><h4 className="text-xs font-semibold truncate group-hover:text-[#F5A623] transition-colors">{p.title}</h4></Link>
                      <p className="text-[10px] text-gray-500 mt-1">{p.subCatTitle}</p>
                      <div className="mt-2"><span className="text-sm font-bold text-[#F5A623]">{p.price || 'Call for Price'}</span></div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Link href={`/product/${p.id}`} className="flex-1 flex items-center justify-center gap-1 bg-[#1E3A52] hover:bg-[#2A4A62] text-gray-300 hover:text-white py-2 rounded-lg text-[10px] font-semibold"><Eye size={12} /> Details</Link>
                        <button disabled={p.inStock === false} onClick={() => addToCart({ id: p.id, title: p.title, price: p.price || '', image: p.image || '', quantity: 1 })} className="flex-1 flex items-center justify-center gap-1 bg-[#F5A623] hover:bg-[#D4911E] disabled:opacity-40 text-[#0A1929] py-2 rounded-lg text-[10px] font-bold"><ShoppingCart size={12} /> Cart</button>
                        <button onClick={() => window.open(waLink(p.title, p.price, `${SITE_URL}/product/${p.id}`), '_blank')} className="w-8 h-8 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center"><MessageCircle size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}