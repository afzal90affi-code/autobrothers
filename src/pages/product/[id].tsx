import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../../lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { ArrowLeft, MessageCircle, Truck, ShieldCheck, Wrench, Phone, Eye, Search, Menu, X, ShoppingCart, Car } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const WA = '923222806245'
const SITE_URL = 'https://autobrothers.pk'
const LOGO_URL = 'https://z-cdn-media.chatglm.cn/files/38af05f1-1af5-464b-875c-700c76d223f0.png?auth_key=1878522932-2701be125ca248b1940a1fc54256fb02-0-136358651fbb20556043afd5c278ea32'

const waLink = (name: string, price?: string, url?: string) => {
  const text = `Salam! AutoBrothers mein "${name}"${price ? ` (${price})` : ''} ki detail chahiye.\n\n🔗 Link: ${url || ''}`
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
}

const condBadge = (c: string) => {
  if (c === 'Good') return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (c === 'Average') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

const serializeDoc = (doc: any) => {
  const data = doc.data()
  const result: any = { id: doc.id }
  for (const key in data) {
    const val = data[key]
    if (val && typeof val.toDate === 'function') {
      result[key] = val.toDate().toISOString()
    } else {
      result[key] = val
    }
  }
  return result
}

export async function getServerSideProps(context: any) {
  const { id } = context.params
  let product = null
  let related: any[] = []

  try {
    const docSnap = await getDoc(doc(db, 'products', id))
    if (docSnap.exists()) {
      product = serializeDoc(docSnap)
      if (product.category) {
        try {
          const snap = await getDocs(query(collection(db, 'products'), where('category', '==', product.category), limit(5)))
          related = snap.docs.map(serializeDoc).filter((p: any) => p.id !== id).slice(0, 4)
        } catch (e) { console.error(e) }
      }
    }
  } catch (e) { console.error(e) }

  return { props: { product, related, productId: id } }
}

export default function ProductDetail({ product, related, productId }: { product: any; related: any[]; productId: string }) {
  const router = useRouter()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [menu, setMenu] = useState(false)
  const { items, removeFromCart, updateQty, clearCart, totalItems, totalPrice } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const url = `${SITE_URL}/product/${productId}`
  const images = [product.image, product.image2].filter(Boolean)

  if (!product) {
    return (
      <>
        <Head><title>Not Found | AutoBrothers</title></Head>
        <div className="min-h-screen bg-[#0A1929] flex items-center justify-center flex-col gap-4 px-4">
          <div className="text-6xl mb-2">😕</div>
          <h2 className="text-2xl font-bold text-white">Product Not Found</h2>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 bg-[#F5A623] text-[#0A1929] font-bold px-6 py-3 rounded-xl text-sm"><ArrowLeft size={16} /> Back</Link>
        </div>
      </>
    )
  }

  const seoTitle = `${product.title} | AutoBrothers Pakistan`
  const seoDesc = product.description || `Buy ${product.title} at ${product.price}. 100% Original Japan imported.`

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc.slice(0, 160)} />
        <meta name="keywords" content={`${product.title}, ${product.category}, used engine Pakistan, AutoBrothers`} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc.slice(0, 160)} />
        <meta property="og:image" content={product.image} />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:image" content={product.image} />
      </Head>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: seoDesc,
            image: images,
            offers: {
              "@type": "Offer",
              url: url,
              priceCurrency: "PKR",
              price: (product.price || "0").replace(/[^\d]/g, ""),
              availability: product.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          })
        }}
      />

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A1929]/95 backdrop-blur-md border-b border-[#1E3A52]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Logo" className="h-10 w-auto rounded" />
            <span className="hidden sm:block font-extrabold text-sm">Auto<span className="text-[#F5A623]">Brothers</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="/#home" className="text-sm text-gray-400 hover:text-[#F5A623] transition-colors">Home</a>
            <a href="/#products" className="text-sm text-gray-400 hover:text-[#F5A623] transition-colors">Products</a>
            <a href="/#categories" className="text-sm text-gray-400 hover:text-[#F5A623] transition-colors">Categories</a>
            <a href="/#about" className="text-sm text-gray-400 hover:text-[#F5A623] transition-colors">About</a>
          </div>

          <div className="flex items-center gap-2">
            <a href="tel:03222806245" className="hidden sm:flex items-center gap-1 text-[11px] text-[#F5A623] bg-[#F5A623]/10 px-3 py-1.5 rounded-lg border border-[#F5A623]/20"><Phone size={12} /> 0322-2806245</a>
            <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 rounded-lg bg-[#13293D] border border-[#1E3A52] flex items-center justify-center text-gray-400 hover:text-[#F5A623]">
              <ShoppingCart size={16} />
              {totalItems > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F5A623] text-[#0A1929] text-[10px] font-bold rounded-full flex items-center justify-center">{totalItems}</span>}
            </button>
            <button onClick={() => setMenu(!menu)} className="md:hidden w-9 h-9 rounded-lg bg-[#13293D] border border-[#1E3A52] flex items-center justify-center text-gray-400">
              {menu ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {menu && (
          <div className="md:hidden bg-[#0A1929] border-t border-[#1E3A52] px-4 py-3 space-y-1">
            <a href="/#home" onClick={() => setMenu(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-[#F5A623]">Home</a>
            <a href="/#products" onClick={() => setMenu(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-[#F5A623]">Products</a>
            <a href="/#categories" onClick={() => setMenu(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-[#F5A623]">Categories</a>
            <a href="/#about" onClick={() => setMenu(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-[#F5A623]">About</a>
          </div>
        )}
      </nav>

      {/* ═══════ CART SIDEBAR ═══════ */}
      {cartOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-[#0A1929] border-l border-[#1E3A52] h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0A1929] border-b border-[#1E3A52] p-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-lg">🛒 Cart ({totalItems})</h3>
              <button onClick={() => setCartOpen(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Cart khaali hai</div>
            ) : (
              <>
                <div className="p-4 space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 bg-[#13293D] border border-[#1E3A52] rounded-xl p-3">
                      <img src={item.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold truncate">{item.title}</h4>
                        <p className="text-sm font-bold text-[#F5A623]">{item.price}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 rounded bg-[#1E3A52] flex items-center justify-center text-xs text-gray-400">−</button>
                          <span className="text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 rounded bg-[#1E3A52] flex items-center justify-center text-xs text-gray-400">+</button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-400 text-xs">🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="sticky bottom-0 bg-[#0A1929] border-t border-[#1E3A52] p-4 space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-400">Total</span><span className="text-xl font-extrabold text-[#F5A623]">Rs {totalPrice}</span></div>
                  <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Order:\n${items.map(p => `• ${p.title} (${p.quantity}x) ${p.price}`).join('\n')}\nTotal: Rs ${totalPrice}`)}`} target="_blank" className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl text-sm"><MessageCircle size={16} /> Order WhatsApp</a>
                  <button onClick={clearCart} className="w-full text-xs text-gray-600 hover:text-red-400">Clear</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="min-h-screen bg-[#0A1929] pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Link href="/" className="hover:text-[#F5A623] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/#products" className="hover:text-[#F5A623] transition-colors">Products</Link>
            <span>/</span>
            <span className="text-gray-300 truncate max-w-[200px]">{product.title}</span>
          </div>

          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#F5A623] mb-6"><ArrowLeft size={16} /> Back</button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* IMAGE GALLERY */}
            <div className="space-y-3">
              <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl overflow-hidden">
                <div className="relative aspect-[4/3] bg-[#0D1F30]">
                  {!imgLoaded && <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" /></div>}
                  <img
                    src={images[activeImg] || 'https://picsum.photos/seed/d/800/600'}
                    alt={product.title}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImgLoaded(true)}
                  />
                  {product.condition && <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-lg border ${condBadge(product.condition)}`}>{product.condition}</span>}
                  {product.inStock === false && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm">Out of Stock</span></div>}
                  {images.length > 1 && <span className="absolute top-4 right-4 bg-black/70 text-[11px] text-white px-3 py-1 rounded-lg backdrop-blur-sm font-semibold">{activeImg + 1} / {images.length}</span>}
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => { setActiveImg(idx); setImgLoaded(false) }}
                      className={`relative flex-1 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeImg === idx ? 'border-[#F5A623] shadow-lg shadow-[#F5A623]/20 scale-[1.02]' : 'border-[#1E3A52] opacity-50 hover:opacity-80 hover:border-[#F5A623]/40'}`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      {activeImg === idx && <div className="absolute inset-0 bg-[#F5A623]/10 flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-[#F5A623] flex items-center justify-center text-[#0A1929]"><Eye size={12} /></div></div>}
                    </button>
                  ))}
                </div>
              )}

              {images.length > 1 && <p className="text-center text-[10px] text-gray-600">👆 Click thumbnails to view different angles</p>}
            </div>

            {/* DETAILS */}
            <div className="flex flex-col">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#F5A623] bg-[#F5A623]/10 px-3 py-1.5 rounded-lg border border-[#F5A623]/20">{product.category}</span>
                {product.featured && <span className="text-[10px] font-bold tracking-wider uppercase text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20">⭐ Featured</span>}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-4">{product.title}</h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-extrabold text-[#F5A623]">{product.price || 'Call for Price'}</span>
                {product.price && <span className="text-xs text-gray-500">PKR</span>}
              </div>

              {product.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><span className="w-1 h-4 bg-[#F5A623] rounded-full" /> Description</h3>
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line bg-[#13293D] border border-[#1E3A52] rounded-xl p-4">{product.description}</p>
                </div>
              )}

              {product.videoUrl && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><span className="w-1 h-4 bg-[#F5A623] rounded-full" /> Video</h3>
                  <a href={product.videoUrl} target="_blank" className="inline-flex items-center gap-2 bg-[#13293D] border border-[#1E3A52] rounded-xl px-4 py-3 text-sm text-[#F5A623] hover:bg-[#1A2B3C] transition-all">▶️ Watch Video</a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Truck, t: 'Free Delivery', s: 'All over Pakistan' },
                  { icon: ShieldCheck, t: '100% Original', s: 'Japan Imported' },
                  { icon: Wrench, t: 'Warranty', s: 'Checking Warranty' },
                  { icon: Phone, t: '24/7 Support', s: 'WhatsApp & Call' },
                ].map((f, i) => {
                  const Icon = f.icon
                  return (
                    <div key={i} className="flex items-center gap-2.5 bg-[#13293D] border border-[#1E3A52] rounded-xl p-3">
                      <Icon size={18} className="text-[#F5A623] flex-none" />
                      <div>
                        <div className="text-[11px] font-semibold text-white">{f.t}</div>
                        <div className="text-[9px] text-gray-500">{f.s}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <a href={waLink(product.title, product.price, url)} target="_blank" className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-green-600 text-white font-bold py-4 rounded-xl text-sm transition-all hover:scale-[1.02]"><MessageCircle size={20} /> Order on WhatsApp</a>
              <a href="tel:03222806245" className="mt-4 text-center text-xs text-gray-500 hover:text-[#F5A623] py-2">📞 Ya call karein: <span className="font-semibold">0322-2806245</span></a>
            </div>
          </div>

          {/* RELATED */}
          {related.length > 0 && (
            <div className="mt-16 border-t border-[#1E3A52] pt-8">
              <div className="mb-6">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">{product.category}</span>
                <h3 className="text-lg font-bold text-white mt-1">Related Products</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {related.map(p => (
                  <div key={p.id} className="bg-[#13293D] border border-[#1E3A52] rounded-xl overflow-hidden hover:border-[#F5A623]/40 hover:-translate-y-1 transition-all duration-300 group">
                    <Link href={`/product/${p.id}`}>
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#0D1F30]">
                        <img src={p.image || 'https://picsum.photos/seed/r/400/300'} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {p.condition && <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md ${condBadge(p.condition)}`}>{p.condition}</span>}
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link href={`/product/${p.id}`}><h4 className="text-xs font-semibold truncate group-hover:text-[#F5A623]">{p.title}</h4></Link>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-sm font-bold text-[#F5A623]">{p.price || 'Call'}</span>
                        <Link href={`/product/${p.id}`} className="w-7 h-7 rounded-lg bg-[#1E3A52] flex items-center justify-center text-gray-400 hover:text-white transition-all"><Eye size={12} /></Link>
                      </div>
                      <a href={waLink(p.title, p.price, `${SITE_URL}/product/${p.id}`)} target="_blank" className="mt-2 w-full flex items-center justify-center gap-1.5 bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white py-2 rounded-lg text-[10px] font-semibold transition-all"><MessageCircle size={12} /> WhatsApp</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WA FAB */}
      <a href={waLink('AutoBrothers')} target="_blank" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"><MessageCircle size={26} /></a>
    </>
  )
}