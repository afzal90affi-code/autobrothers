"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";
import { useCart } from "../context/CartContext";

const WHATSAPP_NUMBER = "923222806245"; // apna number (92 + number)

/* ---------- Chhote SVG icons (koi emoji nahi) ---------- */
const TruckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
  </svg>
);

const CartBigIcon = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const BoxIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
);

const SearchIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

export default function Header() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [banner, setBanner] = useState(true);
  const pathname = usePathname();
  const { items, removeFromCart, totalItems } = useCart();

  // ESC se band karo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setCartOpen(false); setSearchOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cart/search khulne pe body scroll lock
  useEffect(() => {
    document.body.style.overflow = cartOpen || searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen, searchOpen]);

  const orderMsg = encodeURIComponent(
    "Assalam o Alaikum! Mujhe ye products chahiye:\n" +
      items.map((p: any, i: number) => `${i + 1}. ${p.title || p.name} — Rs ${p.price}`).join("\n")
  );

  const total = items.reduce(
    (s: number, p: any) => s + (parseFloat(String(p.price).replace(/[^0-9.]/g, "")) || 0),
    0
  );
  const isBlog = pathname.startsWith("/blog");

  /* Search — full reload ke bajaye router (smooth) */
  const doSearch = () => {
    if (!query.trim()) return;
    setSearchOpen(false);
    router.push(`/shop?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <Navbar onOpenCart={() => setCartOpen(true)} onOpenSearch={() => setSearchOpen(true)} />

      {/* ---------- ANNOUNCEMENT BAR ---------- */}
      {banner && (
        <div className="relative bg-gradient-to-r from-[#F5A623] to-[#FFB94D] text-[#0A1929]">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-bold sm:text-xs">
            <TruckIcon />
            <span>All Pakistan Delivery — Quality Checked Used Parts</span>
          </div>
          <button onClick={() => setBanner(false)} aria-label="Close banner"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#0A1929]/60 hover:text-[#0A1929]">
            ✕
          </button>
        </div>
      )}

      {/* ---------- CART DRAWER ---------- */}
      {cartOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl dark:bg-[#0D1F30]">
            <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-[#1E3A52]">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Your Cart</h3>
                <p className="text-[11px] text-gray-400">{totalItems} item(s)</p>
              </div>
              <button onClick={() => setCartOpen(false)}
                className="h-8 w-8 rounded-lg text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-[#1E3A52] dark:hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {items.length === 0 && (
                <div className="py-16 text-center">
                  <span className="text-gray-300 dark:text-[#1E3A52]">
                    <CartBigIcon />
                  </span>
                  <p className="mt-4 text-sm text-gray-400">Cart khali hai</p>
                  <Link href="/shop" onClick={() => setCartOpen(false)}
                    className="mt-4 inline-block rounded-xl bg-[#F5A623] px-5 py-2.5 text-xs font-bold text-[#0A1929]">
                    Shop Karein →
                  </Link>
                </div>
              )}
              {items.map((p: any, i: number) => (
                <div key={p._id || i}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100 dark:bg-[#13293D] dark:ring-[#1E3A52]">
                  {p.image ? (
                    <img src={p.image} alt={p.title || p.name} className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-gray-300 dark:bg-[#1E3A52]">
                      <BoxIcon />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {p.title || p.name}
                    </p>
                    <p className="text-xs font-bold text-[#F5A623]">Rs {p.price}</p>
                    {p.condition && <p className="text-[10px] text-gray-400">Condition: {p.condition}</p>}
                  </div>
                  <button onClick={() => removeFromCart(p._id || i)}
                    className="text-[11px] font-semibold text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-gray-100 p-5 dark:border-[#1E3A52]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Estimated Total</span>
                  <span className="font-black text-[#F5A623]">Rs {total.toLocaleString("en-PK")}</span>
                </div>
                <a target="_blank" rel="noopener noreferrer"
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${orderMsg}`}
                  className="block w-full rounded-xl bg-green-500 px-4 py-3.5 text-center text-sm font-bold text-white hover:bg-green-600">
                  Order on WhatsApp ✓
                </a>
                <Link href="/cart" onClick={() => setCartOpen(false)}
                  className="block w-full rounded-xl border-2 border-[#F5A623] px-4 py-3 text-center text-sm font-bold text-[#F5A623] transition hover:bg-[#F5A623] hover:text-[#0A1929]">
                  View Cart
                </Link>
                <p className="text-center text-[10px] text-gray-400">
                  Cash on Delivery &amp; Bank Transfer available
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- SEARCH MODAL ---------- */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-24">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-gray-100 dark:bg-[#0D1F30] dark:ring-[#1E3A52]">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 dark:border-[#1E3A52]">
              <span className="text-gray-400"><SearchIcon /></span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder={isBlog ? "Blog posts search karo…" : "Parts search karo… (engine, coil, catalytic)"}
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none dark:text-white"
              />
              <button onClick={() => setSearchOpen(false)}
                className="rounded-md border border-gray-200 px-2 py-1 text-[10px] text-gray-400 dark:border-[#1E3A52]">
                ESC
              </button>
            </div>
            <div className="flex gap-2 pt-4">
              <button onClick={doSearch}
                className="flex-1 rounded-xl bg-[#F5A623] px-4 py-2.5 text-center text-sm font-bold text-[#0A1929]">
                Search Parts
              </button>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  router.push(`/blog?q=${encodeURIComponent(query)}`);
                }}
                className="flex-1 rounded-xl bg-[#13293D] px-4 py-2.5 text-center text-sm font-bold text-white">
                Search Blog
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}