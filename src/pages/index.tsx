import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { client } from '../lib/sanityadmin'
import { Search, Menu, X, Phone, MessageCircle, Truck, ShieldCheck, Wrench, Clock, ChevronRight, ArrowRight, Shield, User, MapPin, Car, ShoppingCart, Eye } from 'lucide-react'
import { useCart } from '../context/CartContext'

import SplashScreen from '../components/animations/splashscreen'
import SocialPopup from '../components/popups/socialpopup'

const WA = '923222806245'
const SITE_URL = 'https://autobrothers.pk'
const LOGO_URL = 'https://z-cdn-media.chatglm.cn/files/38af05f1-1af5-464b-875c-700c76d223f0.png?auth_key=1878522932-2701be125ca248b1940a1fc54256fb02-0-136358651fbb20556043afd5c278ea32'

const waLink = (name: string, price?: string, url?: string) => {
  const text = `Salam! AutoBrothers mein "${name}"${price ? ` (${price})` : ''} ki detail chahiye.\n\n🔗 Link: ${url || ''}`
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
}

const NAV = [
  { l: 'Home', h: '#home' },
  { l: 'Products', h: '#products' },
  { l: 'Categories', h: '#categories' },
  { l: 'About', h: '#about' },
]

const SERVICES = [
  { i: Truck, t: 'delivery charges apply', d: 'All over Pakistan' },
  { i: ShieldCheck, t: '100% Original', d: 'Genuine Japan parts' },
  { i: Wrench, t: 'Warranty', d: 'Checking warranty some parts' },
  { i: Clock, t: '24/7 Support', d: 'WhatsApp & Call' },
]

const condBadge = (c: string) => {
  if (c === 'Good') return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (c === 'Average') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

export async function getStaticProps() {
  const catsQuery = `*[_type == "category"] | order(_createdAt desc){
    "id": _id, "name": title, "slug": slug.current, icon, "image": image.asset->url
  }`;

  const prodsQuery = `*[_type == "product"] | order(_createdAt desc){
    "id": _id, title, price, condition, inStock, featured, newArrival, description, model,
    "image": images[0].asset->url,
    "category": subcategory->parentCategory->title
  }`;

  const cats = await client.fetch(catsQuery);
  const prods = await client.fetch(prodsQuery);

  return { props: { cats, prods }, revalidate: 60 }
}

export default function Home({ cats, prods }: { cats: any[], prods: any[] }) {
  const [mounted, setMounted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [showSocialPopup, setShowSocialPopup] = useState(false)
  
  const [menu, setMenu] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [sort, setSort] = useState('newest')
  const { items, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [showLead, setShowLead] = useState(false)
  const [leadSaved, setLeadSaved] = useState(false)
  const [leadSaving, setLeadSaving] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', city: '', need: '' })

  // --- Admin Password States ---
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showPassModal, setShowPassModal] = useState(false)
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState('')

  const handleAdminClick = () => {
    if (isAdmin) {
      setShowAdminPanel(!showAdminPanel)
    } else {
      setShowPassModal(true)
    }
  }

  const verifyPassword = () => {
    if (passInput === 'azamafzal') { // ⬅️⬅️ APNA PASSWORD YAHAN CHANGE KAREIN
      setIsAdmin(true)
      setShowAdminPanel(true)
      setShowPassModal(false)
      setPassInput('')
      setPassError('')
    } else {
      setPassError('Galat Password hai!')
    }
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setShowAdminPanel(false)
  }
  // -----------------------------------------

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem('ab_splash_done') === '1') {
      setSplashDone(true);
      if (!localStorage.getItem('ab_social_closed')) setShowSocialPopup(true);
    }
    const timer = setTimeout(() => {
      if (!localStorage.getItem('ab_lead')) setShowLead(true)
    }, 8000)
    return () => clearTimeout(timer)
  }, [])

  const closeLead = () => { setShowLead(false); localStorage.setItem('ab_lead', '1') }

  const saveLead = async () => {
    if (!leadForm.name.trim() || !leadForm.phone.trim()) return
    setLeadSaving(true)
    try {
      const text = `Salam! Mera naam ${leadForm.name} hai. WhatsApp: ${leadForm.phone}. City: ${leadForm.city || '-'}. Kis car ka engine/part chahiye: ${leadForm.need || '-'}.`
      const url = `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
      window.open(url, '_blank')
      setLeadSaved(true)
      setTimeout(closeLead, 2500)
    } catch { alert('Error') }
    setLeadSaving(false)
  }

  const featured = prods.filter((p: any) => p.featured).slice(0, 6)

  const filtered = prods.filter((p: any) => {
    const mc = filterCat === 'all' || p.category === filterCat
    const ms = !searchQ || (p.title || '').toLowerCase().includes(searchQ.toLowerCase()) || (p.description || '').toLowerCase().includes(searchQ.toLowerCase())
    return mc && ms
  }).sort((a: any, b: any) => {
    const pa = Number((a.price || '').replace(/[^\d]/g, '')) || 0
    const pb = Number((b.price || '').replace(/[^\d]/g, '')) || 0
    if (sort === 'low') return pa - pb
    if (sort === 'high') return pb - pa
    return 0
  })

  return (
    <>
      <Head>
        <title>AutoBrothers | Quality Used Auto Parts Pakistan</title>
        <meta name="description" content="Buy used engines, gearboxes, alternators. Toyota Honda Suzuki. Japan imported. Free delivery Pakistan. 0322-2806245" />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:title" content="AutoBrothers | Used Auto Parts Pakistan" />
        <meta property="og:description" content="Quality used auto parts. Japan imported. Free delivery." />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": ["LocalBusiness", "Store"], "name": "AutoBrothers - Used Engines & Gearboxes", "url": "https://autobrothers.pk", "telephone": "+923222806245", "address": { "@type": "PostalAddress", "addressLocality": "Karachi", "addressCountry": "PK" }, "areaServed": "Pakistan" }) }} />
      </Head>

      {/* SPLASH SCREEN */}
      {!splashDone && <SplashScreen onFinish={() => {
        setSplashDone(true);
        sessionStorage.setItem('ab_splash_done', '1');
        if (!localStorage.getItem('ab_social_closed')) setShowSocialPopup(true);
      }} />}

      <SocialPopup show={showSocialPopup} onClose={() => { setShowSocialPopup(false); localStorage.setItem('ab_social_closed', '1'); }} />

      {/* MAIN WEBSITE */}
      {splashDone && mounted && (
        <>

          {/* NAV */}
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
                <button onClick={() => setSearchOpen(true)} className="w-9 h-9 rounded-lg bg-[#13293D] border border-[#1E3A52] flex items-center justify-center text-gray-400 hover:text-[#F5A623]"><Search size={16} /></button>
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

          {/* SEARCH MODAL */}
          {searchOpen && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-28 px-4" onClick={() => setSearchOpen(false)}>
              <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl p-5 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                  <Search size={18} className="text-[#F5A623]" />
                  <span className="font-semibold text-sm">Search Parts</span>
                  <button onClick={() => setSearchOpen(false)} className="ml-auto text-gray-500"><X size={16} /></button>
                </div>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Engine, gear, alternator..." className="w-full px-4 py-3 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" autoFocus />
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Engine', 'Gearbox', 'Alternator', 'Toyota', 'Honda', 'Suzuki'].map(t => (
                    <button key={t} onClick={() => { setSearchQ(t); setSearchOpen(false); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }) }} className="px-3 py-1.5 bg-[#1A2B3C] border border-[#1E3A52] rounded-lg text-xs text-gray-400 hover:text-[#F5A623]">{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CART SIDEBAR */}
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
                            <p className="text-sm font-bold text-[#F5A623]">PKR {item.price}</p>
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
                        <span className="text-xl font-extrabold text-[#F5A623]">PKR {totalPrice}</span>
                      </div>
                      <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`🛒 *AutoBrothers Order*\n\n` + items.map(p => `📦 *${p.title}*\n🔗 Link: ${p.link || `${SITE_URL}/product/${p.id}`}\n💵 Price: PKR ${p.price} (x${p.quantity})\n${p.condition ? `⚙️ Condition: ${p.condition}\n` : ''}${p.description ? `📝 Details: ${p.description}...\n` : ''}--------------------`).join('\n\n') + `\n\n💰 *Total: PKR ${totalPrice}*}`)}`} target="_blank" className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl text-sm"><MessageCircle size={16} /> Order WhatsApp</a>
                      <button onClick={clearCart} className="w-full text-xs text-gray-600 hover:text-red-400">Clear</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* HERO */}
          <section id="home" className="pt-16 relative overflow-hidden">
            <div className="relative h-[540px] md:h-[580px]">
              <img src="https://i.ibb.co/84814xg5/b16b-5542697ff3a9c-1296x.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A1929] via-[#0A1929]/80 to-transparent" />
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
                <div className="max-w-xl">
                  <span className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase text-[#F5A623] bg-[#F5A623]/10 px-3 py-1.5 rounded-full mb-5 border border-[#F5A623]/20">🇵🇰 Pakistan Delivery</span>
                  <h2 className="font-extrabold text-4xl sm:text-5xl md:text-6xl leading-[1.08] mb-4">AUTOBROTHERS.PK<br /><span className="text-[#F5A623]">AUTO PARTS</span></h2>
                  <p className="text-gray-400 text-sm md:text-base mb-6 max-w-md">Engines, gearboxes, alternators — original quality. Japan imported, tested & warranted.</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="#categories" className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold px-7 py-3.5 rounded-xl hover:scale-105 transition-all text-sm">Shop Now <ArrowRight size={16} /></a>
                    <a href={waLink('AutoBrothers')} target="_blank" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-green-600 text-white font-bold px-7 py-3.5 rounded-xl hover:scale-105 transition-all text-sm"><MessageCircle size={16} /> WhatsApp</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FIND PARTS */}
          <section className="relative z-20 -mt-8 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto bg-[#13293D] border border-[#1E3A52] rounded-2xl p-5 shadow-2xl">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-300"><Search size={16} className="text-[#F5A623]" /> Find Parts for Your Vehicle</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <input placeholder="Make (Toyota)" className="px-3 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none" />
                <input placeholder="Model (Corolla)" className="px-3 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none" />
                <input placeholder="Year (2020)" className="px-3 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none" />
                <select className="px-3 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-gray-400 focus:outline-none"><option>All</option>{cats.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}</select>
                <button className="col-span-2 md:col-span-1 bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-2.5 rounded-xl text-sm">Search</button>
              </div>
            </div>
          </section>

          {/* FEATURED */}
          {featured.length > 0 && (
            <section className="pt-12 pb-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Featured</span>
                    <h2 className="text-xl font-bold mt-1">Hot Deals 🔥</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={`https://wa.me/${WA}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full transition-colors">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                    <a href="#products" className="text-xs text-[#F5A623] flex items-center gap-1">View All <ChevronRight size={14} /></a>
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {featured.map(p => (
                    <div key={p.id} className="flex-none w-[200px] sm:w-[220px]">
                      <Link href={`/product/${p.id}`} className="block bg-[#13293D] border border-[#1E3A52] rounded-2xl overflow-hidden hover:border-[#F5A623]/40 transition-all group">
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <img src={p.image || 'https://picsum.photos/seed/d/400/500'} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          {p.condition && <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm border ${condBadge(p.condition)}`}>{p.condition}</span>}
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-semibold truncate group-hover:text-[#F5A623]">{p.title}</h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-bold text-[#F5A623]">PKR {p.price || 'Call'}</span>
                            <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hi, I'm interested in: ${p.title}`)}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </a>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CATEGORIES */}
          <section id="categories" className="py-14 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="mb-8 sm:mb-10">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Browse</span>
                <h2 className="text-2xl md:text-3xl font-bold mt-1">Popular Categories</h2>
              </div>
              {cats.length === 0 ? (
                <div className="text-center py-12 bg-[#13293D] border border-[#1E3A52] rounded-2xl text-sm text-gray-500">Admin se categories add karein</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
                  {cats.map(c => (
                    <Link key={c.id} href={`/category/${c.slug}`} className="bg-[#13293D] border border-[#1E3A52] rounded-2xl overflow-hidden hover:border-[#F5A623]/50 transition-all duration-500 group hover:-translate-y-1.5 hover:shadow-[0_16px_48px_-12px_rgba(245,166,35,0.2)]">
                      <div className="aspect-[5/4] overflow-hidden">
                        <img src={c.image || `https://picsum.photos/seed/${c.name?.replace(/\s/g, '').toLowerCase()}/400/300`} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      </div>
                      <div className="p-3 sm:p-4 text-center">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-200 group-hover:text-[#F5A623] transition-colors duration-300">{c.name}</h4>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* PRODUCTS */}
          <section id="products" className="py-14 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Shop</span>
                  <h2 className="text-2xl md:text-3xl font-bold mt-1">Best Selling Products</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${filterCat === 'all' ? 'bg-[#F5A623] text-[#0A1929]' : 'bg-[#13293D] border border-[#1E3A52] text-gray-400 hover:text-[#F5A623]'}`}>All</button>
                    {cats.slice(0, 4).map(c => (
                      <button key={c.id} onClick={() => setFilterCat(c.name)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${filterCat === c.name ? 'bg-[#F5A623] text-[#0A1929]' : 'bg-[#13293D] border border-[#1E3A52] text-gray-400 hover:text-[#F5A623]'}`}>{c.icon} {c.name.split(' ')[0]}</button>
                    ))}
                  </div>
                  <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-1.5 bg-[#13293D] border border-[#1E3A52] rounded-lg text-[11px] text-gray-400 focus:outline-none">
                    <option value="newest">Newest</option>
                    <option value="low">Low→High</option>
                    <option value="high">High→Low</option>
                  </select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-20"><div className="text-5xl mb-3">🔍</div><h3 className="font-bold text-lg">No products</h3></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filtered.map(p => (
                    <div key={p.id} className="bg-[#13293D] border border-[#1E3A52] rounded-2xl overflow-hidden hover:border-[#F5A623]/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_-10px_rgba(245,166,35,0.12)] transition-all duration-300 group flex flex-col">
                      <div className="relative aspect-square overflow-hidden bg-[#0D1F30]">
                        <img src={p.image || 'https://picsum.photos/seed/d/400/400'} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {p.condition && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm border ${condBadge(p.condition)}`}>{p.condition}</span>}
                          {p.newArrival && <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/80 text-white backdrop-blur-sm border border-blue-400/30">🆕 New</span>}
                        </div>
                        {p.featured && <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-orange-500/80 text-white backdrop-blur-sm border border-orange-400/30">🔥</span>}
                        {p.inStock === false && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10"><span className="bg-red-600 text-white px-3 py-1 rounded-md font-bold text-[10px]">Out of Stock</span></div>}
                      </div>
                      <div className="p-2.5 sm:p-3 flex flex-col flex-1 gap-1">
                        <Link href={`/product/${p.id}`}>
                          <h4 className="text-[11px] sm:text-xs font-bold text-gray-100 group-hover:text-[#F5A623] transition-colors line-clamp-2 leading-snug">{p.title}</h4>
                        </Link>
                        <div className="mt-auto pt-2">
                          <span className="text-sm sm:text-base font-extrabold text-[#F5A623]">PKR {p.price || 'Call'}</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            <button disabled={p.inStock === false} onClick={() => addToCart({ id: p.id, title: p.title, price: p.price || '', image: p.image || '', quantity: 1, link: `${SITE_URL}/product/${p.id}`, condition: p.condition, description: p.description ? p.description.substring(0, 150) : '' })} className="flex-1 flex items-center justify-center gap-1 bg-[#F5A623] hover:bg-[#D4911E] disabled:opacity-40 text-[#0A1929] py-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-colors"><ShoppingCart size={12} /> Add</button>
                            <button onClick={() => window.open(waLink(p.title, p.price, `${SITE_URL}/product/${p.id}`), '_blank')} className="flex-1 flex items-center justify-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white py-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-colors"><MessageCircle size={13} /> Chat</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SERVICES */}
          <section className="py-12 border-y border-[#1E3A52]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              {SERVICES.map((s, i) => { const I = s.i; return <div key={i} className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-[#F5A623]/10 flex items-center justify-center flex-none"><I size={20} className="text-[#F5A623]" /></div><div><h4 className="text-sm font-semibold">{s.t}</h4><p className="text-[11px] text-gray-500">{s.d}</p></div></div> })}
            </div>
          </section>

          {/* ABOUT */}
          <section id="about" className="py-14 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#1E3A52]"><img src="https://i.ibb.co/6c9K3pGG/513539006-24142213332079622-6522291205224702067-n.jpg" alt="Workshop" className="w-full h-full object-cover" /></div>
                <div className="absolute -bottom-4 -right-4 bg-[#F5A623] text-[#0A1929] rounded-xl px-5 py-3 shadow-xl"><div className="text-xl font-extrabold">25+</div><div className="text-[10px] font-bold">Years</div></div>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">About</span>
                <h2 className="text-2xl md:text-3xl font-bold mt-1 mb-4">Pakistan&apos;s Trusted <span className="text-[#F5A623]">Auto Parts</span></h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">Japani used parts — engines, gearboxes, alternators. WhatsApp karein. COD available.</p>
                <div className="grid grid-cols-3 gap-3">
                  {[{ v: '3000+', l: 'Customers' }, { v: '5000+', l: 'Sold' }, { v: '25+', l: 'Years' }].map((s, i) => <div key={i} className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-3 text-center"><div className="text-lg font-extrabold text-[#F5A623]">{s.v}</div><div className="text-[10px] text-gray-500">{s.l}</div></div>)}
                </div>
              </div>
            </div>
          </section>
          
          {/* SOCIAL PAGES */}
          <section className="py-14 md:py-20 border-t border-[#1E3A52]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-8">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Stay Connected</span>
                <h2 className="text-2xl md:text-3xl font-bold mt-1">Follow Our Pages</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-[#1E3A52]">
                    <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center flex-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-white truncate">AutoBrothers</h4><p className="text-[10px] text-gray-500">Facebook Page</p></div>
                    <a href="https://www.facebook.com/profile.php?id=100064020401353" target="_blank" className="bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold px-4 py-1.5 rounded-lg text-[11px]">Follow</a>
                  </div>
                  <div className="relative bg-[#1a1a1a] flex items-center justify-center overflow-hidden" style={{ height: '300px' }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#0D1F30] z-0">
                      <div className="w-16 h-16 rounded-full bg-[#1877F2] flex items-center justify-center mb-4"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
                      <h4 className="text-white font-bold text-lg">AutoBrothers</h4><p className="text-gray-400 text-xs mt-1 mb-5">Visit our Facebook Page</p>
                      <a href="https://www.facebook.com/profile.php?id=100064020401353" target="_blank" className="bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold px-6 py-2 rounded-lg text-sm inline-flex items-center gap-2">Open Facebook</a>
                    </div>
                    <iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D100064020401353&tabs=timeline&width=340&height=300&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true" width="340" height="300" style={{border:'none', overflow:'hidden', position:'relative', zIndex: '10', background: 'white'}} scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                  </div>
                </div>
                <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-[#1E3A52]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center flex-none"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></div>
                    <div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-white truncate">autobrothers.pk</h4><p className="text-[10px] text-gray-500">Instagram Page</p></div>
                    <a href="https://instagram.com/autobrothers.pk" target="_blank" className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white font-bold px-4 py-1.5 rounded-lg text-[11px] cursor-pointer">Follow</a>
                  </div>
                  <div className="relative flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#13293D] to-[#0A1929]" style={{ height: '300px' }}>
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(https://i.ibb.co/84814xg5/b16b-5542697ff3a9c-1296x.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <div className="relative z-10 w-full">
                      <div className="w-24 h-24 rounded-full border-4 border-pink-500 p-1 mx-auto mb-4 shadow-lg shadow-pink-500/20"><img src={LOGO_URL} alt="IG Profile" className="w-full h-full rounded-full object-cover" /></div>
                      <h3 className="text-lg font-bold text-white">AutoBrothers.Pk</h3><p className="text-xs text-gray-400 mt-1 mb-4">🇵🇰 Japan Imported Auto Parts</p>
                      <div className="flex items-center justify-center gap-6 mb-5"><div><span className="font-bold text-white text-sm">540</span><p className="text-[9px] text-gray-500">Posts</p></div><div><span className="font-bold text-white text-sm">10.5K</span><p className="text-[9px] text-gray-500">Followers</p></div><div><span className="font-bold text-white text-sm">150</span><p className="text-[9px] text-gray-500">Following</p></div></div>
                      <a href="https://instagram.com/autobrothers.pk" target="_blank" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-bold px-8 py-2.5 rounded-xl text-sm shadow-lg shadow-pink-500/20 hover:scale-105 transition-transform cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg> Visit Page</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-[#13293D] border-t border-[#1E3A52]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div><img src={LOGO_URL} alt="Logo" className="h-10 w-auto rounded mb-2" /><p className="text-xs text-gray-500">Best quality used parts.</p></div>
              <div><h4 className="font-semibold text-sm mb-3">Links</h4>{NAV.map(n => <a key={n.l} href={n.h} className="block text-xs text-gray-500 hover:text-[#F5A623] py-1">{n.l}</a>)}</div>
              <div><h4 className="font-semibold text-sm mb-3">Categories</h4>{cats.slice(0, 5).map(c => <button key={c.id} onClick={() => { setFilterCat(c.name); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }) }} className="block text-xs text-gray-500 hover:text-[#F5A623] py-1">{c.icon} {c.name}</button>)}</div>
              <div><h4 className="font-semibold text-sm mb-3">Contact</h4><p className="text-xs text-gray-500 py-1">📞 0322-2806245</p><p className="text-xs text-gray-500 py-1">📍 Karachi</p></div>
            </div>
            <div className="border-t border-[#1E3A52]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                <p className="text-[11px] text-gray-600">© 2025 AutoBrothers</p>
                <button onClick={handleAdminClick} className="text-[11px] text-gray-600 hover:text-[#F5A623] flex items-center gap-1">
                  <Shield size={11} /> {isAdmin ? 'Admin Panel ⚙️' : 'Admin 🔒'}
                </button>
              </div>
            </div>
          </footer>

          {/* LEAD POPUP */}
          {showLead && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={closeLead}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <div className="relative w-full max-w-sm rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="h-1.5 bg-gradient-to-r from-[#F5A623] via-[#FFD700] to-[#F5A623]" />
                <div className="bg-[#13293D] border border-[#1E3A52] border-t-0 rounded-b-2xl">
                  <button onClick={closeLead} className="absolute top-5 right-4 text-gray-500 hover:text-white text-xs">✕</button>
                  <div className="px-6 pt-6 pb-4 text-center"><div className="text-3xl mb-2">🚗</div><h3 className="text-lg font-bold">Kya Part Chahiye?</h3><p className="text-xs text-gray-500 mt-1">Detail dein — best deal denge</p></div>
                  {!leadSaved ? (
                    <div className="px-6 pb-6 space-y-3">
                      <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="Naam" className="w-full pl-9 pr-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" /></div>
                      <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="WhatsApp number" type="tel" className="w-full pl-9 pr-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" /></div>
                      <div className="relative"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={leadForm.city} onChange={e => setLeadForm({ ...leadForm, city: e.target.value })} placeholder="City" className="w-full pl-9 pr-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" /></div>
                      <div className="relative"><Car size={14} className="absolute left-3 top-3 text-gray-600" /><textarea value={leadForm.need} onChange={e => setLeadForm({ ...leadForm, need: e.target.value })} placeholder="Kis car ka engine ya kaunsa part chahiye?" rows={2} className="w-full pl-9 pr-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50 resize-none" /></div>
                      <button onClick={() => window.open(waLink(leadForm.need || 'Kis car ka engine ya kaunsa part chahiye?', undefined, SITE_URL), '_blank')} className="w-full inline-flex items-center justify-center gap-2 border border-[#1E3A52] bg-[#1A2B3C] hover:bg-[#142330] text-[#F5A623] font-bold py-3 rounded-xl text-sm"><MessageCircle size={16} /> WhatsApp par batao</button>
                      <button onClick={saveLead} disabled={leadSaving || !leadForm.name.trim() || !leadForm.phone.trim()} className="w-full bg-[#F5A623] hover:bg-[#D4911E] disabled:opacity-40 text-[#0A1929] font-bold py-3 rounded-xl text-sm">{leadSaving ? '⏳...' : 'Submit ➤'}</button>
                    </div>
                  ) : (
                    <div className="px-6 pb-8 text-center"><div className="text-3xl mb-2">✅</div><h3 className="font-bold">Done!</h3></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ADMIN PANEL SIDEBAR */}
          {showAdminPanel && isAdmin && (
            <div className="fixed inset-0 z-[80] flex justify-end" onClick={() => setShowAdminPanel(false)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative w-full max-w-md bg-[#0A1929] border-l border-[#1E3A52] h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-[#0A1929] border-b border-[#1E3A52] p-4 flex items-center justify-between z-10">
                  <h3 className="font-bold text-lg text-[#F5A623]">⚙️ Admin Panel</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={handleLogout} className="text-[11px] text-red-400 border border-red-400/30 px-2 py-1 rounded-lg hover:bg-red-400/10">Logout</button>
                    <button onClick={() => setShowAdminPanel(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="bg-[#13293D] border border-[#1E3A52] p-4 rounded-xl">
                      <h4 className="text-sm font-bold text-gray-300 mb-2">Dashboard</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0D1F30] p-3 rounded-lg text-center">
                          <p className="text-xl font-bold text-[#F5A623]">{prods.length}</p>
                          <p className="text-[10px] text-gray-500">Total Products</p>
                        </div>
                        <div className="bg-[#0D1F30] p-3 rounded-lg text-center">
                          <p className="text-xl font-bold text-[#F5A623]">{cats.length}</p>
                          <p className="text-[10px] text-gray-500">Categories</p>
                        </div>
                      </div>
                    </div>
                    <Link href="/admin" className="block w-full text-center bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl text-sm transition-colors">
                      Go to Full Admin Page ➤
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSWORD MODAL */}
          {showPassModal && (
            <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
              <div className="bg-[#13293D] p-6 rounded-2xl border border-[#1E3A52] w-full max-w-sm shadow-2xl">
                <h2 className="text-xl font-bold text-white text-center mb-5">Admin Login 🔒</h2>
                <input type="password" placeholder="Enter Password" value={passInput} onChange={(e) => setPassInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyPassword()} className="w-full px-4 py-3 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623] mb-2" />
                {passError && <p className="text-red-500 text-xs mb-3 text-center">{passError}</p>}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { setShowPassModal(false); setPassError(''); setPassInput(''); }} className="w-1/2 py-2.5 rounded-xl border border-[#1E3A52] text-gray-400 hover:bg-[#1E3A52] transition-colors">Cancel</button>
                  <button onClick={verifyPassword} className="w-1/2 py-2.5 rounded-xl bg-[#F5A623] text-[#0A1929] font-bold hover:bg-[#D4911E] transition-colors">Login</button>
                </div>
              </div>
            </div>
          )}

          {/* WA FAB */}
          <a href={waLink('AutoBrothers')} target="_blank" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform"><MessageCircle size={26} /></a>
        
        </>
      )}
    </>
  )
}