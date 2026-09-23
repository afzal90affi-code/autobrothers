"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, Sun, Moon, Menu, X, FileText, Car, Home } from "lucide-react";
import { useCart } from "../context/CartContext";

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

export default function Navbar({ onOpenCart, onOpenSearch }: Props) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };

  // "/" sirf exact match par active hoga, warna Home har page par active dikhega
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

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