import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { ShoppingCart, Home, Store, FileText, Car } from 'lucide-react'

/* ⚠️ CDN link expire ho jata hai — local logo use karo:
   logo ko public/ folder mein daalo aur path /logo.png likho */
const LOGO_URL = '/logo.png'

export default function TopNav() {
  const { totalItems } = useCart()

  return (
    <nav className="sticky top-0 z-50 bg-[#0A1929]/95 backdrop-blur-md border-b border-[#1E3A52]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <img src={LOGO_URL} alt="AutoBrothers" className="h-10 w-auto rounded" />
          <span className="hidden sm:block font-extrabold text-sm">
            Auto<span className="text-[#F5A623]">Brothers</span>
          </span>
        </Link>

        {/* ---- Nav links ---- */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-[#F5A623] transition-colors">
            Home
          </Link>
          <Link href="/shop" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#F5A623] transition-colors">
            <Store size={14} /> Shop
          </Link>
          <Link href="/blog" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#F5A623] transition-colors">
            <FileText size={14} /> Blog
          </Link>
          <Link href="/new-cars" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#F5A623] transition-colors">
            <Car size={14} /> New Cars
          </Link>
        </div>

        {/* ---- Right side ---- */}
        <div className="flex items-center gap-2">
          <Link href="/bucket" className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#13293D] border border-[#1E3A52] text-gray-400 hover:text-[#F5A623]">
            <ShoppingCart size={16} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F5A623] text-[#0A1929] text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          <Link href="/shop" className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#0A1929] bg-[#F5A623] px-3 py-1.5 rounded-lg hover:bg-[#FFB94D] transition-colors">
            <Store size={12} /> Shop
          </Link>
          <Link href="/" className="hidden sm:flex items-center gap-1 text-[11px] text-[#F5A623] bg-[#F5A623]/10 px-3 py-1.5 rounded-lg border border-[#F5A623]/20">
            <Home size={12} /> Home
          </Link>
        </div>
      </div>
    </nav>
  )
}