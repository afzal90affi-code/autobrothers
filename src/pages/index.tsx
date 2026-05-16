import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { db } from '../lib/firebase'
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { Search, Menu, X, Phone, MessageCircle, Truck, ShieldCheck, Wrench, Clock, ChevronRight, ArrowRight, Shield, User, MapPin, Car, ShoppingCart, Eye } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { motion, AnimatePresence } from 'framer-motion'

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
  if (c === 'Good') return 'bg-green-500/20 text-green-400'
  if (c === 'Average') return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-red-500/20 text-red-400'
}

export default function Home() {
  const [prods, setProds] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
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
  
  // 🏎️ TURBO SPLASH STATE
  const [showSplash, setShowSplash] = useState(true)
  const [engineStarted, setEngineStarted] = useState(false)
  const [activeLights, setActiveLights] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [showSocialPopup, setShowSocialPopup] = useState(false)

  // 🏎️ Function to generate RPM Gauge Marks & SQUARE LED Lights
  const generateRPMGauge = () => {
    const marks = [];
    const cx = 150, cy = 150, r = 120;
    
    for (let val = 0; val <= 8; val++) {
      const angle = -120 + (val * 30);
      const rad = (angle * Math.PI) / 180;
      
      const x1 = cx + r * Math.cos(rad);
      const y1 = cy + r * Math.sin(rad);
      const x2 = cx + (r - 15) * Math.cos(rad);
      const y2 = cy + (r - 15) * Math.sin(rad);
      marks.push(<line key={`l${val}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth="3" strokeLinecap="round" />);
      
      const textR = 88;
      const tx = cx + textR * Math.cos(rad);
      const ty = cy + textR * Math.sin(rad);
      marks.push(<text key={`t${val}`} x={tx} y={ty} fill="#666" fontSize="16" fontWeight="bold" textAnchor="middle" dominantBaseline="central" fontFamily="sans-serif">{val}</text>);
    }

    // 🏎️ SQUARE LED LIGHTS (1 to 8)
    for (let i = 1; i <= 8; i++) {
      const angle = -120 + (i * 30);
      const rad = (angle * Math.PI) / 180;
      const lightR = 108;
      const lx = cx + lightR * Math.cos(rad);
      const ly = cy + lightR * Math.sin(rad);
      
      const isRed = i >= 6;
      const isActive = i <= activeLights;

      marks.push(
        <rect 
          key={`led${i}`}
          x="-7" y="-7" 
          width="14" height="14" 
          rx="2"
          transform={`translate(${lx}, ${ly}) rotate(${angle + 90})`}
          fill={isActive ? (isRed ? "#FF3300" : "#00AAFF") : "#1a1a1a"} 
          style={{ filter: isActive ? `drop-shadow(0 0 8px ${isRed ? '#FF3300' : '#00AAFF'})` : 'none', transition: 'all 0.1s ease-out' }}
        />
      );
    }
    
    return marks;
  }

  // 🏎️ ENGINE START FUNCTION
   const handleEngineStart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio blocked:", e));
    }
    setEngineStarted(true);
    
    let step = 1;
    const revUp = setInterval(() => {
      setActiveLights(step);
      step++;
      if (step > 8) {
        clearInterval(revUp);
        setTimeout(() => {
          let downStep = 8;
          const revDown = setInterval(() => {
            downStep--;
            setActiveLights(downStep);
            if (downStep <= 1) {
              clearInterval(revDown);
              setTimeout(() => {
                setShowSplash(false);
                // ✅ NAYA LOGIC: Splash band hone ke baad social popup dikhana (Agar pehle close na kiya gaya ho)
                if (!localStorage.getItem('ab_social_closed')) {
                  setShowSocialPopup(true);
                }
              }, 500);
            }
          }, 100);
        }, 800); 
      }
    }, 150);
  }

  useEffect(() => {
    const unsub1 = onSnapshot(
      query(collection(db, 'products'), orderBy('createdAt', 'desc')),
      (s) => setProds(s.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const unsub2 = onSnapshot(
      collection(db, 'categories'),
      (s) => setCats(s.docs.map(d => ({ id: d.id, ...d.data() })).filter((c: any) => c.active !== false))
    )
    const timer = setTimeout(() => {
      if (!localStorage.getItem('ab_lead')) setShowLead(true)
    }, 8000)
    
    return () => { unsub1(); unsub2(); clearTimeout(timer) }
  }, [])

  const closeLead = () => { setShowLead(false); localStorage.setItem('ab_lead', '1') }

  const saveLead = async () => {
    if (!leadForm.name.trim() || !leadForm.phone.trim()) return
    setLeadSaving(true)
    try {
      await addDoc(collection(db, 'leads'), { ...leadForm, createdAt: serverTimestamp(), source: 'popup' })
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
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "Store"],
      "name": "AutoBrothers - Used Engines & Gearboxes",
      "url": "https://autobrothers.pk",
      "image": "https://autobrothers.pk/logo.png",
      "telephone": "+923222806245",
      "description": "Used Japanese car engines, gearboxes, alternators and auto parts in Pakistan. Tested and imported quality parts.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Shershah Market, SITE Area",
        "addressLocality": "Karachi",
        "addressCountry": "PK"
      },
      "areaServed": "Pakistan",
      "priceRange": "Rs",
      "sameAs": [],
      "department": {
        "@type": "AutoRepair",
        "name": "Used Engine & Gear Division"
      }
    })
  }}
/>
      </Head>

      {/* 🎵 Audio Tag */}
      <audio ref={audioRef} src="/car-start.mp3" preload="auto" />

      {/* ═══════ 🏎️ LED RPM SPLASH SCREEN ═══════ */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            key="splash"
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background Glow */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: activeLights > 5 ? 0.4 : 0.1 }}
              transition={{ duration: 0.5 }}
              className="absolute w-96 h-96 rounded-full blur-[150px]"
              style={{ backgroundColor: activeLights > 5 ? '#FF3300' : '#00AAFF' }}
            />

            {/* RPM Gauge SVG */}
            <div className="relative z-10 w-72 h-72 md:w-96 md:h-96">
              <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
                <circle cx="150" cy="150" r="145" fill="#080808" stroke="#222" strokeWidth="6" />
                <circle cx="150" cy="150" r="138" fill="#050505" />
                {generateRPMGauge()}
                <text x="150" y="175" textAnchor="middle" fill="#555" fontSize="9" fontWeight="bold" letterSpacing="2">RPM x1000</text>
              </svg>
            </div>

            {/* Title */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl md:text-5xl font-black text-white relative z-10 mt-6"
            >
              AUTO<span className="text-[#F5A623]">BROTHERS</span>
            </motion.div>
            
            {/* 🏎️ REALISTIC ENGINE START/STOP BUTTON */}
            {!engineStarted ? (
              <motion.button 
                onClick={handleEngineStart}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(255, 0, 0, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10 mt-8 w-36 h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center cursor-pointer group focus:outline-none"
                style={{
                  // Chrome Metallic Ring Effect
                  background: "conic-gradient(from 0deg, #555, #222, #888, #333, #666, #111, #777, #222, #555)",
                  padding: '8px'
                }}
              >
                {/* Inner Dark Face of Button */}
                <div className="w-full h-full rounded-full bg-[#111] flex flex-col items-center justify-center relative border-2 border-gray-800 shadow-inner">
                  
                  {/* Red Glow Halo behind text */}
                  <div className="absolute w-20 h-20 bg-red-600 rounded-full blur-2xl opacity-30 group-hover:opacity-70 transition-opacity duration-300"></div>
                  
                  {/* Text Lines */}
                  <span className="relative text-[10px] md:text-xs font-extrabold tracking-[0.3em] text-red-500" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.8)' }}>ENGINE</span>
                  <span className="relative text-[10px] md:text-xs font-extrabold tracking-[0.3em] text-red-500 mt-1" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.8)' }}>START</span>
                  <span className="relative text-[10px] md:text-xs font-extrabold tracking-[0.3em] text-red-500 mt-1" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.8)' }}>STOP</span>
                  
                </div>
              </motion.button>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-400 mt-6 relative z-10 tracking-widest uppercase"
              >
                Pakistan's Trusted Auto Parts
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ MAIN WEBSITE ═══════ */}

            {/* ═══════ SOCIAL FOLLOW POPUP ═══════ */}
      <AnimatePresence>
        {showSocialPopup && (
          <motion.div 
            key="social-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[190] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowSocialPopup(false); localStorage.setItem('ab_social_closed', '1'); }}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative w-full max-w-sm bg-[#13293D] border border-[#1E3A52] rounded-2xl p-6 text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => { setShowSocialPopup(false); localStorage.setItem('ab_social_closed', '1'); }} 
                className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
              
              <div className="text-4xl mb-3">🏁</div>
              <h3 className="text-xl font-bold text-white">Join Our Garage!</h3>
              <p className="text-xs text-gray-400 mt-1 mb-5">Latest parts, deals & auto tips ke liye follow karein.</p>
              
              <div className="flex flex-col gap-3">
                {/* Instagram Button */}
                <a
                  href="https://www.instagram.com/autobrothers.pk/" // ⚠️ Yahan apna Instagram URL daalein
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-pink-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  Follow on Instagram
                </a>
                
                {/* Facebook Button */}
                <a
                  href="https://www.facebook.com/profile.php?id=100064020401353" // ⚠️ Yahan apna Facebook URL daalein
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Follow on Facebook
                </a>
              </div>
              
              <button 
                onClick={() => { setShowSocialPopup(false); localStorage.setItem('ab_social_closed', '1'); }} 
                className="mt-4 text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
                  <a href={`https://wa.me/${WA}?text=${encodeURIComponent(`Order:\n${items.map(p => `• ${p.title} (${p.quantity}x) ${p.price}`).join('\n')}\nTotal: Rs ${totalPrice}`)}`} target="_blank" className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl text-sm"><MessageCircle size={16} /> Order WhatsApp</a>
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
          <div className="absolute top-0 h-full w-[40%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] pointer-events-none" style={{ animation: 'sweepLight 5s ease-in-out infinite' }} />
          <div className="absolute right-[10%] bottom-[15%] pointer-events-none hidden md:block" style={{ animation: 'floatGear 8s ease-in-out infinite' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" opacity="0.06"><circle cx="60" cy="60" r="55" stroke="#F5A623" strokeWidth="2" strokeDasharray="8 8" /><circle cx="60" cy="60" r="30" stroke="#F5A623" strokeWidth="3" /></svg>
          </div>
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
            <select className="px-3 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-gray-400 focus:outline-none">
              <option>All</option>
              {cats.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
            <button className="col-span-2 md:col-span-1 bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-2.5 rounded-xl text-sm">Search</button>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="pt-12 pb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <div><span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Featured</span><h2 className="text-xl font-bold mt-1">Hot Deals 🔥</h2></div>
              <a href="#products" className="text-xs text-[#F5A623] flex items-center gap-1">View All <ChevronRight size={14} /></a>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {featured.map(p => (
                <div key={p.id} className="flex-none w-[240px] sm:w-[260px]">
                  <Link href={`/product/${p.id}`} className="block bg-[#13293D] border border-[#1E3A52] rounded-xl overflow-hidden hover:border-[#F5A623]/40 transition-all group">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img src={p.image || 'https://picsum.photos/seed/d/400/300'} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {p.image2 && <img src={p.image2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
                      {p.image2 && <span className="absolute bottom-2 right-2 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">📷 1/2</span>}
                      {p.condition && <span className={`absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md ${condBadge(p.condition)}`}>{p.condition}</span>}
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-semibold truncate group-hover:text-[#F5A623]">{p.title}</h4>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm font-bold text-[#F5A623]">{p.price || 'Call'}</span>
                        <span className="text-[10px] text-gray-500">Details →</span>
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
          <div className="mb-8">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Browse</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-1">Popular Categories</h2>
          </div>
          {cats.length === 0 ? (
            <div className="text-center py-12 bg-[#13293D] border border-[#1E3A52] rounded-2xl text-sm text-gray-500">Admin se categories add karein</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {cats.map(c => (
                <button key={c.id} onClick={() => { setFilterCat(c.name); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }) }} className="bg-[#13293D] border border-[#1E3A52] rounded-xl overflow-hidden hover:border-[#F5A623]/40 transition-all group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={c.image || `https://picsum.photos/seed/${c.name.replace(/\s/g, '').toLowerCase()}/400/300`} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                  </div>
                  <div className="p-3 text-center">
                    <div className="text-xl mb-1">{c.icon}</div>
                    <h4 className="text-[11px] font-semibold text-gray-300 group-hover:text-[#F5A623]">{c.name}</h4>
                  </div>
                </button>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-[#13293D] border border-[#1E3A52] rounded-xl overflow-hidden hover:border-[#F5A623]/40 hover:-translate-y-1 transition-all duration-300 group">
                  <Link href={`/product/${p.id}`}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#0D1F30]">
                      <img src={p.image || 'https://picsum.photos/seed/d/400/300'} alt={p.title} className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${p.image2 ? 'group-hover:opacity-0' : ''}`} />
                      {p.image2 && <img src={p.image2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />}
                      {p.image2 && <span className="absolute bottom-2 right-2 bg-black/70 text-[9px] text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">📷 1/2</span>}
                      {p.condition && <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md ${condBadge(p.condition)}`}>{p.condition}</span>}
                      {p.inStock === false && <span className="absolute top-2 right-2 bg-red-500/90 text-[9px] font-bold text-white px-2 py-0.5 rounded-md">Out of Stock</span>}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/product/${p.id}`}><h4 className="text-xs font-semibold truncate group-hover:text-[#F5A623] transition-colors">{p.title}</h4></Link>
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
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#1E3A52]"><img src="https://picsum.photos/seed/abworkshop2/700/525" alt="Workshop" className="w-full h-full object-cover" /></div>
            <div className="absolute -bottom-4 -right-4 bg-[#F5A623] text-[#0A1929] rounded-xl px-5 py-3 shadow-xl"><div className="text-xl font-extrabold">5+</div><div className="text-[10px] font-bold">Years</div></div>
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">About</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-1 mb-4">Pakistan&apos;s Trusted <span className="text-[#F5A623]">Auto Parts</span></h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">Japani used parts — engines, gearboxes, alternators. WhatsApp karein. COD available.</p>
            <div className="grid grid-cols-3 gap-3">
              {[{ v: '3000+', l: 'Customers' }, { v: '5000+', l: 'Sold' }, { v: '5+', l: 'Years' }].map((s, i) => <div key={i} className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-3 text-center"><div className="text-lg font-extrabold text-[#F5A623]">{s.v}</div><div className="text-[10px] text-gray-500">{s.l}</div></div>)}
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
            
            {/* ✅ FACEBOOK CARD */}
            <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-[#1E3A52]">
                <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center flex-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">AutoBrothers</h4>
                  <p className="text-[10px] text-gray-500">Facebook Page</p>
                </div>
                <a href="https://www.facebook.com/profile.php?id=100064020401353" target="_blank" className="bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold px-4 py-1.5 rounded-lg text-[11px]">Follow</a>
              </div>
              
              <div className="relative bg-[#1a1a1a] flex items-center justify-center overflow-hidden" style={{ height: '300px' }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#0D1F30] z-0">
                  <div className="w-16 h-16 rounded-full bg-[#1877F2] flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <h4 className="text-white font-bold text-lg">AutoBrothers</h4>
                  <p className="text-gray-400 text-xs mt-1 mb-5">Visit our Facebook Page</p>
                  <a href="https://www.facebook.com/profile.php?id=100064020401353" target="_blank" className="bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold px-6 py-2 rounded-lg text-sm inline-flex items-center gap-2">
                    Open Facebook
                  </a>
                </div>

                <iframe 
                  src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D100064020401353&tabs=timeline&width=340&height=300&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true" 
                  width="340" 
                  height="300" 
                  style={{border:'none', overflow:'hidden', position:'relative', zIndex: '10', background: 'white'}} 
                  scrolling="no" 
                  frameBorder="0" 
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share">
                </iframe>
              </div>
            </div>

            {/* ✅ INSTAGRAM CARD (Official Embed Look) */}
            <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-[#1E3A52]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center flex-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  {/* ⚠️ APNA INSTAGRAM USERNAME YAHAN LIKHEIN */}
                  <h4 className="text-sm font-bold text-white truncate">autobrothers.pk</h4>
                  <p className="text-[10px] text-gray-500">Instagram Page</p>
                </div>
                {/* ⚠️ APNA INSTAGRAM LINK YAHAN DAALEIN */}
                <a href="https://instagram.com/autobrothers.pk" target="_blank" className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white font-bold px-4 py-1.5 rounded-lg text-[11px] cursor-pointer">Follow</a>
              </div>
              
              {/* Instagram Profile & Visit Page Area */}
              <div className="relative flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#13293D] to-[#0A1929]" style={{ height: '300px' }}>
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(https://i.ibb.co/84814xg5/b16b-5542697ff3a9c-1296x.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                
                <div className="relative z-10 w-full">
                  <div className="w-24 h-24 rounded-full border-4 border-pink-500 p-1 mx-auto mb-4 shadow-lg shadow-pink-500/20">
                    <img src={LOGO_URL} alt="IG Profile" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <h3 className="text-lg font-bold text-white">AutoBrothers.Pk</h3>
                  <p className="text-xs text-gray-400 mt-1 mb-4">🇵🇰 Japan Imported Auto Parts</p>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-center gap-6 mb-5">
                    <div><span className="font-bold text-white text-sm">540</span><p className="text-[9px] text-gray-500">Posts</p></div>
                    <div><span className="font-bold text-white text-sm">10.5K</span><p className="text-[9px] text-gray-500">Followers</p></div>
                    <div><span className="font-bold text-white text-sm">150</span><p className="text-[9px] text-gray-500">Following</p></div>
                  </div>
                  
                  {/* ⚠️ APNA INSTAGRAM LINK YAHAN BHI DAALEIN */}
                  <a href="https://instagram.com/autobrothers.pk" target="_blank" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-bold px-8 py-2.5 rounded-xl text-sm shadow-lg shadow-pink-500/20 hover:scale-105 transition-transform cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                    Visit Page
                  </a>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between">
            <p className="text-[11px] text-gray-600">© 2025 AutoBrothers</p>
            <Link href="/admin" className="text-[11px] text-gray-600 hover:text-[#F5A623]"><Shield size={11} className="inline" /> Admin</Link>
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
                  <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="WhatsApp" type="tel" className="w-full pl-9 pr-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" /></div>
                  <div className="relative"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={leadForm.city} onChange={e => setLeadForm({ ...leadForm, city: e.target.value })} placeholder="City" className="w-full pl-9 pr-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50" /></div>
                  <div className="relative"><Car size={14} className="absolute left-3 top-3 text-gray-600" /><textarea value={leadForm.need} onChange={e => setLeadForm({ ...leadForm, need: e.target.value })} placeholder="Kya chahiye?" rows={2} className="w-full pl-9 pr-4 py-2.5 bg-[#0D1F30] border border-[#1E3A52] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#F5A623]/50 resize-none" /></div>
                  <button onClick={saveLead} disabled={leadSaving || !leadForm.name.trim() || !leadForm.phone.trim()} className="w-full bg-[#F5A623] hover:bg-[#D4911E] disabled:opacity-40 text-[#0A1929] font-bold py-3 rounded-xl text-sm">{leadSaving ? '⏳...' : 'Submit ➤'}</button>
                </div>
              ) : (
                <div className="px-6 pb-8 text-center"><div className="text-3xl mb-2">✅</div><h3 className="font-bold">Done!</h3></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WA FAB */}
      <a href={waLink('AutoBrothers')} target="_blank" className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform" style={{ animation: 'pulseGlow 2.5s infinite' }}><MessageCircle size={26} /></a>
    </>
  )
}