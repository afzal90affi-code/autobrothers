"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ShoppingCart, Search, Sun, Moon, Menu, X, FileText, Car, Home } from "lucide-react";
import { useCart } from "../context/CartContext";
import { client } from "../lib/sanityClient";
import SecondaryNav, {
  type NavCat,
  type NavMainCat,
  type NavSection,
} from "./SecondaryNav";

type Props = { onOpenCart: () => void; onOpenSearch: () => void };

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: ShoppingCart },
  { href: "/blog", label: "Blog", icon: FileText },
  { href: "/new-cars", label: "New Cars", icon: Car },
];
const PLAIN = [
  { href: "/about", label: "About" },
  { href: "/contact-us", label: "Contact" },
];

/* ============================================================
   ✅ NAYA — NAVBAR SECONDARY BAR DATA
   Main categories + categories (mainId/mainTitle/mainSlug ke
   sath) — SecondaryNav inhi se main chips + second row banata
   hai. Junk titles filter (test/demo/sample waaghera).
============================================================ */
const NAV_CATS_QUERY = `{
  "mainCats": *[_type == "mainCategory"] | order(coalesce(order, 9999) asc, title asc) {
    _id, title, "slug": slug.current
  },
  "cats": *[_type == "category"] | order(coalesce(order, 9999) asc, title asc) {
    _id, title, "slug": slug.current,
    "mainId": mainCategory->_id,
    "mainTitle": mainCategory->title,
    "mainSlug": mainCategory->slug.current
  }
}`;

type NavData = { mainCats: NavMainCat[]; cats: NavCat[] };

const JUNK = ["test", "delete", "demo", "sample", "dummy", "asdf", "check", "us news"];
const isJunk = (t?: string) => !!t && JUNK.some((j) => (t || "").toLowerCase().includes(j));

/* pathname → kaunsa section? (sirf in pages pe secondary bar dikhega) */
function sectionOf(pathname: string | null): NavSection | null {
  if (!pathname) return null;
  if (pathname === "/shop" || pathname.startsWith("/shop/") || pathname.startsWith("/product/"))
    return "shop";
  if (pathname === "/blog" || pathname.startsWith("/blog/")) return "blog";
  if (pathname === "/new-cars" || pathname.startsWith("/new-cars/")) return "cars";
  return null;
}

/* ============================================================
   ✅ NAYA — SECONDARY BAR (Suspense ke andar render hota hai)
   useSearchParams static pages pe Suspense maangta hai isliye
   ye chhota component alag hai. Section ke hisaab se:
   - shop → /shop?cat=...  (main categories + second row)
   - blog → /blog?cat=...
   - cars → /new-cars?brand=...
============================================================ */
function SecondaryBar({ cats, mainCats }: { cats: NavCat[]; mainCats: NavMainCat[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const section = sectionOf(pathname);
  if (!section) return null;

  const activeCat = searchParams.get(section === "cars" ? "brand" : "cat");

  return (
    <SecondaryNav
      section={section}
      cats={cats}
      activeCat={activeCat}
      mainCats={mainCats}
    />
  );
}

export default function Navbar({ onOpenCart, onOpenSearch }: Props) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [cats, setCats] = useState<NavCat[]>([]);
  const [mainCats, setMainCats] = useState<NavMainCat[]>([]);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  /* ✅ NAYA: categories ek dafa fetch — sirf shop/blog/cars pages pe
     (home/about pe fetch hi nahi hota, network bachao) */
  const section = sectionOf(pathname);

  useEffect(() => {
    if (!section) return;
    let alive = true;
    client
      .fetch<NavData>(NAV_CATS_QUERY)
      .then((d) => {
        if (!alive || !d) return;
        setMainCats(
          (d.mainCats || []).filter((m) => m?.title && m?.slug && !isJunk(m.title))
        );
        setCats(
          (d.cats || []).filter((c) => c?.title && c?.slug && !isJunk(c.title))
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [section]);

  // "/" sirf exact match par active hoga, warna Home har page par active dikhega
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };

  return (
    <nav className="sticky top-0 z-50">
      {/* ===== Premium top accent line ===== */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#F5A623] via-[#FFD9A0] to-[#F5A623]" />

      {/* ===== Main bar — LIGHT: white glass | DARK: navy glass ===== */}
      <div className="border-b border-gray-200/80 bg-white/85 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-[#1E3A52] dark:bg-[#0A1929]/90 dark:shadow-none">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* ---- Logo ---- */}
          <Link href="/" className="group flex items-center gap-2.5">
            <img src="/logo.png" alt="AutoBrothers"
              className="h-10 w-auto rounded-lg ring-1 ring-gray-200 transition-transform duration-300 group-hover:scale-105 dark:ring-[#1E3A52]" />
            <span className="hidden select-none text-xl font-black italic tracking-tight sm:block">
              <span className="bg-gradient-to-r from-slate-900 via-amber-700 to-[#F5A623] bg-clip-text text-transparent dark:from-white dark:via-[#FFD9A0] dark:to-[#F5A623]">
                Auto
              </span>
              <span className="bg-gradient-to-r from-[#F5A623] to-[#FF8A00] bg-clip-text text-transparent">
                Brothers
              </span>
            </span>
          </Link>

          {/* ---- Desktop links ---- */}
          <div className="hidden items-center gap-1.5 md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className={`group relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-[17px] font-bold transition-all duration-300 ${
                  isActive(item.href)
                    ? "bg-gradient-to-r from-[#F5A623] to-[#FFB94D] text-[#0A1929] shadow-lg shadow-[#F5A623]/30"
                    : "text-gray-600 hover:bg-amber-50 hover:text-[#F5A623] dark:text-gray-400 dark:hover:bg-[#13293D] dark:hover:text-white"
                }`}>
                <item.icon size={16} className={`transition-transform duration-300 group-hover:scale-110 ${
                  isActive(item.href) ? "" : "text-[#F5A623]"
                }`} />
                {item.label}
              </Link>
            ))}

            <span className="mx-1.5 h-5 w-px bg-gray-300 dark:bg-[#1E3A52]" />

            {PLAIN.map((item) => (
              <Link key={item.href} href={item.href}
                className={`relative px-3 py-2 text-[17px] font-semibold transition-colors ${
                  isActive(item.href)
                    ? "text-[#F5A623]"
                    : "text-gray-600 hover:text-[#F5A623] dark:text-gray-400 dark:hover:text-white"
                }`}>
                {item.label}
                {/* Animated underline */}
                <span className={`absolute inset-x-2 -bottom-0.5 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] transition-transform duration-300 ${
                  isActive(item.href) ? "scale-x-100" : "scale-x-0 hover:scale-x-100"
                }`} />
              </Link>
            ))}
          </div>

          {/* ---- Right icons ---- */}
          <div className="flex items-center gap-1.5">
            <button onClick={onOpenSearch} aria-label="Search"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-all hover:bg-amber-50 hover:text-[#F5A623] dark:text-gray-400 dark:hover:bg-[#13293D] dark:hover:text-[#F5A623]">
              <Search size={18} />
            </button>
            <button onClick={onOpenCart} aria-label="Cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-all hover:bg-amber-50 hover:text-[#F5A623] dark:text-gray-400 dark:hover:bg-[#13293D] dark:hover:text-[#F5A623]">
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-[#F5A623] to-[#FF8A00] text-[10px] font-black text-white shadow-md shadow-[#F5A623]/40">
                  {totalItems}
                </span>
              )}
            </button>
            <button onClick={toggleTheme} aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-all hover:rotate-12 hover:bg-amber-50 hover:text-[#F5A623] dark:text-gray-400 dark:hover:bg-[#13293D] dark:hover:text-[#F5A623]">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 hover:text-[#F5A623] dark:text-gray-400 md:hidden">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          ✅ NAYA — SECONDARY BAR (navbar ke neeche, sticky sath)
          Shop page: main categories chips + click pe uski attached
          categories neeche second row me.
          Blog/Cars pages: apne apne chips (purana style).
          Home/About/Contact pe ye bar bilkul hidden.
      ============================================================ */}
      {section && (
        <Suspense fallback={null}>
          <SecondaryBar cats={cats} mainCats={mainCats} />
        </Suspense>
      )}

      {/* ---- Mobile menu — themed ---- */}
      {menuOpen && (
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-2 shadow-xl dark:border-[#1E3A52] dark:bg-[#0A1929] md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-bold transition ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-[#F5A623]/20 to-transparent text-[#F5A623]"
                  : "text-gray-700 dark:text-gray-400"
              }`}>
              <item.icon size={16} /> {item.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-gray-200 dark:bg-[#1E3A52]" />
          {PLAIN.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className={`flex items-center rounded-xl px-3 py-3 text-[15px] font-bold transition ${
                isActive(item.href) ? "text-[#F5A623]" : "text-gray-700 dark:text-gray-400"
              }`}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
