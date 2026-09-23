"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { client } from "../lib/sanityClient";

const WHATSAPP_NUMBER = "923222806245";
const LOGO_URL = "/logo.png"; // ⚠️ logo public/ folder mein dalo — CDN link permanent nahi hota

const SHOP_LINKS = [
  { l: "All Products", h: "/products" },
  { l: "New Cars", h: "/new-cars" },
  { l: "Car Finance", h: "/car-finance" },
  { l: "Cart", h: "/cart" },
];

const COMPANY_LINKS = [
  { l: "About Us", h: "/about" },
  { l: "Contact Us", h: "/contact-us" },
  { l: "Blog", h: "/blog" },
];

/* ✅ ADSENSE REQUIRED — legal pages ke links (approval ke liye mandatory) */
const LEGAL_LINKS = [
  { l: "Privacy Policy", h: "/privacy-policy" },
  { l: "Terms & Conditions", h: "/terms" },
  { l: "Disclaimer", h: "/disclaimer" },
];

type Cat = { _id: string; title: string; slug: string };

export default function Footer() {
  const [cats, setCats] = useState<Cat[]>([]);

  useEffect(() => {
    client
      .fetch<Cat[]>(`*[_type == "category" && defined(slug.current)] | order(coalesce(order, 9999) asc, title asc) [0...6]{ _id, title, "slug": slug.current }`)
      .then(setCats)
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#13293D] border-t border-[#1E3A52] text-gray-400">
      {/* ---------- MAIN FOOTER ---------- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">

        {/* Brand + About — AdSense ko site ka clear purpose chahiye */}
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <img src={LOGO_URL} alt="AutoBrothers Pakistan — Used Auto Parts" className="h-10 w-auto rounded-lg" />
            <span className="text-lg font-black text-white">Auto<span className="text-[#F5A623]">Brothers</span></span>
          </Link>
          <p className="mt-3 text-xs leading-relaxed max-w-sm">
            Pakistan's trusted marketplace for quality checked used auto parts — engines, catalytic
            converters, transmissions, ignition coils aur bohot kuch. Expert car care guides ke
            saath, all Pakistan delivery.
          </p>
          <div className="mt-4 flex gap-2">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A52] hover:bg-green-500 transition text-sm">📱</a>
            <a href={`tel:+${WHATSAPP_NUMBER}`} aria-label="Phone"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A52] hover:bg-[#F5A623] transition text-sm">📞</a>
            <a href="#" aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A52] hover:bg-blue-500 transition text-sm">📘</a>
            <a href="#" aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A52] hover:bg-pink-500 transition text-sm">📸</a>
          </div>
        </div>

        {/* Shop Links */}
        <div>
          <h4 className="font-bold text-sm mb-3 text-white">Shop</h4>
          {SHOP_LINKS.map((n) => (
            <Link key={n.l} href={n.h} className="block py-1.5 text-xs hover:text-[#F5A623] transition-colors">
              {n.l}
            </Link>
          ))}
        </div>

        {/* Categories — Sanity se dynamic */}
        <div>
          <h4 className="font-bold text-sm mb-3 text-white">Parts Categories</h4>
          {cats.length === 0 ? (
            <p className="text-xs text-gray-600">Loading…</p>
          ) : (
            cats.map((c) => (
              <Link key={c._id} href={`/products?cat=${c.slug}`}
                className="block py-1.5 text-xs hover:text-[#F5A623] transition-colors truncate">
                {c.title}
              </Link>
            ))
          )}
        </div>

        {/* Company + Legal — ✅ AdSense requirement yahan clear dikhni chahiye */}
        <div>
          <h4 className="font-bold text-sm mb-3 text-white">Company</h4>
          {COMPANY_LINKS.map((n) => (
            <Link key={n.l} href={n.h} className="block py-1.5 text-xs hover:text-[#F5A623] transition-colors">
              {n.l}
            </Link>
          ))}
          <h4 className="font-bold text-sm mt-5 mb-2 text-white">Legal</h4>
          {LEGAL_LINKS.map((n) => (
            <Link key={n.l} href={n.h} className="block py-1.5 text-xs hover:text-[#F5A623] transition-colors">
              {n.l}
            </Link>
          ))}
        </div>
      </div>

      {/* ---------- CONTACT STRIP ---------- */}
      <div className="border-t border-[#1E3A52]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>📞 <a href={`tel:+${WHATSAPP_NUMBER}`} className="hover:text-[#F5A623] font-semibold text-gray-300">0322-2806245</a></p>
          <p>📍 Karachi, Pakistan — 🕘 Mon–Sat, 9am–8pm</p>
          <p>💳 Cash on Delivery • Bank Transfer</p>
        </div>
      </div>

      {/* ---------- BOTTOM BAR ---------- */}
      <div className="border-t border-[#1E3A52] bg-[#0D1F30]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[11px] text-gray-600">
            © {new Date().getFullYear()} AutoBrothers.pk — All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* AdSense disclosure — recommended */}
            <span className="text-[10px] text-gray-600">This site uses cookies & serves ads via Google AdSense</span>
            <Link href="/admin" className="text-[11px] text-gray-600 hover:text-[#F5A623] transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}