import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { client } from '../../lib/sanityadmin'
import { ShoppingCart, MessageCircle, ArrowLeft, Truck, ShieldCheck, Wrench, Phone, Menu, X, Search } from 'lucide-react' // ✅ Nav icons add kiye
import { useCart } from '../../context/CartContext'

const WA = '923222806245'
const SITE_URL = 'https://autobrothers.pk'
const LOGO_URL = 'https://z-cdn-media.chatglm.cn/files/38af05f1-1af5-464b-875c-700c76d223f0.png?auth_key=1878522932-2701be125ca248b1940a1fc54256fb02-0-136358651fbb20556043afd5c278ea32'

const NAV = [
  { l: 'Home', h: '/' },
  { l: 'Products', h: '/#products' },
  { l: 'Categories', h: '/#categories' },
  { l: 'About', h: '/#about' },
]

const waLink = (name: string, price?: string, url?: string) => {
  const text = `Salam! AutoBrothers mein "${name}"${price ? ` (${price})` : ''} ki detail chahiye.\n\n🔗 Link: ${url || ''}`
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
}

const condBadge = (c: string) => {
  if (c === 'Good') return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (c === 'Average') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

export async function getStaticPaths() {
  const ids = await client.fetch(`*[_type == "product"]._id`)
  return { paths: ids.map((id: string) => ({ params: { id } })), fallback: 'blocking' }
}

export async function getStaticProps({ params }: any) {
  const prodQuery = `*[_type == "product" && _id == $id][0]{
    _id, title, price, condition, inStock, featured, newArrival, description,
    "images": images[].asset->url,
    "subCatTitle": subcategory->title,
    "catTitle": subcategory->parentCategory->title
  }`
  const product = await client.fetch(prodQuery, { id: params.id })
  return { props: { product }, revalidate: 60 }
}

export default function ProductPage({ product }: any) {
  console.log("Product Data from Sanity:", product)
  const { items, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice } = useCart() // ✅ Cart hook
  const [selectedImage, setSelectedImage] = useState(0)
  const [menu, setMenu] = useState(false)
  const [cartOpen, setCartOpen] = useState(false) // ✅ Cart state

  if (!product) return <div className="min-h-screen bg-[#0A1929] text-white flex items-center justify-center">Loading...</div>

  const images = product.images && product.images.length > 0 ? product.images : ['https://picsum.photos/seed/noimg/600/450']
  const currentUrl = `${SITE_URL}/product/${product._id}`
  const cleanPrice = Number((product.price || '0').replace(/[^\d]/g, '')) || 0

  return (
    <>
      <Head>
        <title>{product.title} | AutoBrothers Pakistan</title>
        <meta name="description" content={product.description || `Buy ${product.title} at best price from AutoBrothers.pk.`} />
        <link rel="canonical" href={currentUrl} />
        <meta property="og:title" content={`${product.title} | AutoBrothers`} />
        <meta property="og:description" content={product.description || 'Quality auto parts in Pakistan'} />
        <meta property="og:image" content={images[0]} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", "name": product.title, "image": images, "description": product.description || "Quality used auto part", "sku": product._id, "brand": { "@type": "Brand", "name": "AutoBrothers" }, "offers": { "@type": "Offer", "url": currentUrl, "priceCurrency": "PKR", "price": cleanPrice, "itemCondition": `https://schema.org/${product.condition === 'Good' ? 'UsedCondition' : 'DamagedCondition'}`, "availability": product.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", "seller": { "@type": "Organization", "name": "AutoBrothers" } } }) }} />
      </Head>

      {/* ✅ NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A1929]/95 backdrop-blur-md border-b border-[#1E3A52]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Logo" className="h-10 w-auto rounded" />
            <span className="hidden sm:block font-extrabold text-sm">Auto<span className="text-[#F5A623]">Brothers</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV.map(n => <a key={n.l} href={n.h} className="text-sm text-gray-400 hover:text-[#F5A623] transition-colors">{n.l}</a>)}
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
            {NAV.map(n => <a key={n.l} href={n.h} onClick={() => setMenu(false)} className="block px-4 py-2.5 text-sm text-gray-400 hover:text-[#F5A623]">{n.l}</a>)}
          </div>
        )}
      </nav>

      {/* ✅ CART SIDEBAR */}
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
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total</span>
                    <span className="text-xl font-extrabold text-[#F5A623]">Rs {totalPrice}</span>
                  </div>
                 <a href={`https://wa.me/${WA}?text=${encodeURIComponent(
  `🛒 *AutoBrothers Order*\n\n` + 
  items.map(p => 
    `📦 *${p.title}*\n` +
    `🔗 Link: ${p.link || `${SITE_URL}/product/${p.id}`}\n` +
    `💵 Price: ${p.price} (x${p.quantity})\n` +
    (p.condition ? `⚙️ Condition: ${p.condition}\n` : '') +
    (p.description ? `📝 Details: ${p.description}...\n` : '') +
    `--------------------`
  ).join('\n\n') + 
  `\n\n💰 *Total: Rs ${totalPrice}*`
)}`} target="_blank" className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl text-sm">
  <MessageCircle size={16} /> Order WhatsApp
</a>
                  <button onClick={clearCart} className="w-full text-xs text-gray-600 hover:text-red-400">Clear</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ MAIN PRODUCT CONTENT */}
      <div className="min-h-screen bg-[#0A1929] text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="mb-6">
            <Link href="/#products" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#F5A623] mb-3 transition-colors"><ArrowLeft size={16} /> Back to Shop</Link>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Link href="/" className="hover:text-gray-300">Home</Link> <span>/</span> 
              {product.catTitle && <><span className="hover:text-gray-300">{product.catTitle}</span> <span>/</span></>}
              {product.subCatTitle && <><span className="hover:text-gray-300">{product.subCatTitle}</span> <span>/</span></>}
              <span className="text-gray-300 truncate">{product.title}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            
            <div>
              <div className="aspect-square bg-[#0D1F30] border border-[#1E3A52] rounded-2xl overflow-hidden mb-4 relative">
                <img src={images[selectedImage]} alt={product.title} className="w-full h-full object-cover transition-opacity duration-300" />
                {product.inStock === false && <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold">Out of Stock</div>}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((img: string, idx: number) => (
                    <button key={idx} onClick={() => setSelectedImage(idx)} className={`w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${selectedImage === idx ? 'border-[#F5A623]' : 'border-[#1E3A52] hover:border-gray-500'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {product.featured && <span className="text-[11px] font-bold px-3 py-1 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30">🔥 Featured</span>}
                {product.newArrival && <span className="text-[11px] font-bold px-3 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">🆕 New Arrival</span>}
                {product.condition && <span className={`text-[11px] font-bold px-3 py-1 rounded-md border ${condBadge(product.condition)}`}>{product.condition} Condition</span>}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">{product.title}</h1>
              <div className="mb-6"><span className="text-3xl font-black text-[#F5A623]">{product.price || 'Call for Price'}</span></div>

              {product.description && (
                <div className="mb-6 text-sm text-gray-400 leading-relaxed whitespace-pre-line border-l-2 border-[#F5A623]/30 pl-4">{product.description}</div>
              )}

              <div className="space-y-3 mb-8">
               <button 
  disabled={product.inStock === false} 
  onClick={() => addToCart({ 
    id: product._id, 
    title: product.title, 
    price: product.price || '', 
    image: images[0], 
    quantity: 1,
    link: currentUrl, // ✅ Product URL
    condition: product.condition, // ✅ Condition
    description: product.description ? product.description.substring(0, 150) : '' // ✅ First 150 chars of description
  })} 
  className="w-full flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#D4911E] disabled:opacity-40 text-[#0A1929] font-bold py-4 rounded-xl text-base transition-colors"
>
  <ShoppingCart size={20} /> Add to Cart
</button>
                <a href={waLink(product.title, product.price, currentUrl)} target="_blank" className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-green-600 text-white font-bold py-4 rounded-xl text-base transition-colors"><MessageCircle size={20} /> Order via WhatsApp</a>
                <a href="tel:03222806245" className="w-full flex items-center justify-center gap-2 border border-[#1E3A52] bg-[#13293D] hover:bg-[#1A2B3C] text-gray-300 font-bold py-3 rounded-xl text-sm transition-colors"><Phone size={16} /> Call: 0322-2806245</a>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-3 text-center"><Truck size={20} className="mx-auto text-[#F5A623] mb-1" /><p className="text-[10px] text-gray-400">All Pakistan Delivery</p></div>
                <div className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-3 text-center"><ShieldCheck size={20} className="mx-auto text-[#F5A623] mb-1" /><p className="text-[10px] text-gray-400">100% Original</p></div>
                <div className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-3 text-center"><Wrench size={20} className="mx-auto text-[#F5A623] mb-1" /><p className="text-[10px] text-gray-400">Warranty</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp FAB */}
      <a href={waLink(product.title, product.price, currentUrl)} target="_blank" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"><MessageCircle size={26} /></a>
    </>
  )
}