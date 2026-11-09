"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, ChevronRight } from "lucide-react";
import { client } from "../lib/sanityClient";

/* ============================================================
   AutoBrothers Footer — 3-Level Grouped Categories Version
   Hierarchy: MainCategory -> Category -> SubCategory
   - Main Category (orange heading) -> uske neeche Categories
     (white bold) -> har category ke neeche Sub Categories (gray)
   - Links: /products?cat=<slug> — /products page teeno level
     ke slugs handle karta hai
   - Jis category ka Main Category set nahi, wo "More Categories"
     block me apne aap dikhegi
   - Sub Category / Category ka slug kabhi change na karna
   ============================================================ */

const WHATSAPP_NUMBER = "923222806245";

const SHOP_LINKS = [
  { label: "All Products", href: "/products" },
  { label: "New Cars", href: "/new-cars" },
  { label: "Cart", href: "/cart" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Blog", href: "/blog" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];

interface SubCat {
  _id: string;
  title: string;
  slug: string;
}

interface CatNode {
  _id: string;
  title: string;
  slug: string;
  subs: SubCat[];
}

interface MainCatGroup {
  _id: string;
  title: string;
  slug: string;
  cats: CatNode[];
}

const MAX_GROUPS = 6;  // footer me max main categories
const MAX_CATS = 6;    // har main category ke neeche max categories
const MAX_SUBS = 4;    // har category ke neeche max sub links

export default function Footer() {
  const [groups, setGroups] = useState<MainCatGroup[]>([]);
  const [orphanCats, setOrphanCats] = useState<CatNode[]>([]);
  const year = new Date().getFullYear();

  useEffect(() => {
    // Query 1: Main Categories -> unki Categories -> unki Sub Categories
    const groupsQuery = `*[_type == "mainCategory" && defined(slug.current)] | order(coalesce(order, 9999) asc, title asc)[0...${MAX_GROUPS}]{
      _id, title, "slug": slug.current,
      "cats": *[_type == "category" && defined(slug.current) && references(^._id)] | order(coalesce(order, 9999) asc, title asc)[0...${MAX_CATS}]{
        _id, title, "slug": slug.current,
        "subs": *[_type == "subcategory" && defined(slug.current) && references(^._id)] | order(title asc)[0...${MAX_SUBS}]{
          _id, title, "slug": slug.current
        }
      }
    }`;

    // Query 2: Categories jin ka Main Category set nahi (back-compat)
    const orphansQuery = `*[_type == "category" && defined(slug.current) && !defined(mainCategory)] | order(coalesce(order, 9999) asc, title asc)[0...10]{
      _id, title, "slug": slug.current,
      "subs": *[_type == "subcategory" && defined(slug.current) && references(^._id)] | order(title asc)[0...${MAX_SUBS}]{
        _id, title, "slug": slug.current
      }
    }`;

    Promise.all([
      client.fetch(groupsQuery).catch(() => [] as MainCatGroup[]),
      client.fetch(orphansQuery).catch(() => [] as CatNode[]),
    ]).then(([g, o]) => {
      setGroups(Array.isArray(g) ? g : []);
      setOrphanCats(Array.isArray(o) ? o : []);
    });
  }, []);

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Salam! Mujhe auto parts chahiye."
  )}`;

  const linkCol = (title: string, links: { label: string; href: string }[]) => (
    <div>
      <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-xs text-gray-400 hover:text-[#F5A623] transition-colors inline-flex items-center gap-1"
            >
              <ChevronRight size={11} className="text-[#F5A623]" /> {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-[#0A1929] text-gray-300 border-t border-[#1E3A52]">
      {/* ===== CONTACT STRIP ===== */}
      <div className="bg-[#13293D] border-b border-[#1E3A52]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-300 text-center sm:text-left">
            Koi part chahiye?{" "}
            <span className="font-bold text-white">WhatsApp karke foran pochho</span> — Japan
            imported, tested &amp; warranted parts.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1FB855] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
            >
              <MessageCircle size={14} /> {WHATSAPP_NUMBER}
            </a>
            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
            >
              <Phone size={14} /> Call Now
            </a>
          </div>
        </div>
      </div>

      {/* ===== MAIN FOOTER ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Brand + link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-baseline gap-0.5 mb-3">
              <span className="text-2xl font-extrabold text-white">Auto</span>
              <span className="text-2xl font-extrabold text-[#F5A623]">Brothers</span>
            </Link>
            <p className="text-xs leading-relaxed text-gray-400">
              Pakistan ka trusted online store for Japan imported used auto parts — engines,
              transmissions, electrical parts aur bohat kuch. Quality checked, warranted, foran
              delivery.
            </p>
          </div>

          {linkCol("Shop", SHOP_LINKS)}
          {linkCol("Company", COMPANY_LINKS)}
          {linkCol("Legal", LEGAL_LINKS)}
        </div>

        {/* ===== PARTS CATEGORIES — 3-level grouped ===== */}
        {(groups.length > 0 || orphanCats.length > 0) && (
          <div className="border-t border-[#1E3A52] pt-8">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-5">
              Parts Categories
            </h4>

            {/* Main Category groups */}
            {groups.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {groups.map((g) => (
                  <div key={g._id}>
                    <Link
                      href={`/products?cat=${g.slug}`}
                      className="text-xs font-bold text-[#F5A623] hover:underline"
                    >
                      {g.title}
                    </Link>
                    {g.cats && g.cats.length > 0 && (
                      <ul className="mt-3 space-y-3">
                        {g.cats.map((c) => (
                          <li key={c._id}>
                            <Link
                              href={`/products?cat=${c.slug}`}
                              className="text-xs font-bold text-white hover:text-[#F5A623] transition-colors"
                            >
                              {c.title}
                            </Link>
                            {c.subs && c.subs.length > 0 && (
                              <ul className="mt-1.5 space-y-1.5 ml-2 border-l border-[#1E3A52] pl-2.5">
                                {c.subs.map((s) => (
                                  <li key={s._id}>
                                    <Link
                                      href={`/products?cat=${s.slug}`}
                                      className="text-[11px] text-gray-400 hover:text-[#F5A623] transition-colors"
                                    >
                                      {s.title}
                                    </Link>
                                  </li>
                                ))}
                                {c.subs.length >= MAX_SUBS && (
                                  <li>
                                    <Link
                                      href={`/products?cat=${c.slug}`}
                                      className="text-[10px] text-gray-500 hover:text-[#F5A623] transition-colors"
                                    >
                                      + more
                                    </Link>
                                  </li>
                                )}
                              </ul>
                            )}
                          </li>
                        ))}
                        {g.cats.length >= MAX_CATS && (
                          <li>
                            <Link
                              href={`/products?cat=${g.slug}`}
                              className="text-[10px] text-gray-500 hover:text-[#F5A623] transition-colors"
                            >
                              + {g.cats.length} categories dekho
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Categories jinka Main Category set nahi */}
            {orphanCats.length > 0 && (
              <div className={groups.length > 0 ? "mt-8 pt-6 border-t border-[#1E3A52]/60" : ""}>
                {groups.length > 0 && (
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-4">
                    More Categories
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                  {orphanCats.map((cat) => (
                    <div key={cat._id}>
                      <Link
                        href={`/products?cat=${cat.slug}`}
                        className="text-xs font-bold text-[#F5A623] hover:underline"
                      >
                        {cat.title}
                      </Link>
                      {cat.subs && cat.subs.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {cat.subs.map((s) => (
                            <li key={s._id}>
                              <Link
                                href={`/products?cat=${s.slug}`}
                                className="text-xs text-gray-400 hover:text-[#F5A623] transition-colors"
                              >
                                {s.title}
                              </Link>
                            </li>
                          ))}
                          {cat.subs.length >= MAX_SUBS && (
                            <li>
                              <Link
                                href={`/products?cat=${cat.slug}`}
                                className="text-[10px] text-gray-500 hover:text-[#F5A623] transition-colors"
                              >
                                + more
                              </Link>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <div className="border-t border-[#1E3A52]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-gray-500">
            © {year} <span className="font-bold text-gray-400">AutoBrothers.pk</span> — All Rights
            Reserved.
          </p>
          <p className="text-[11px] text-gray-500">
            Japan Imported Used Auto Parts — Whole Pakistan Delivery
          </p>
        </div>
      </div>
    </footer>
  );
}