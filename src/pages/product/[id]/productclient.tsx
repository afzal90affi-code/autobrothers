"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Wrench,
  Phone,
  Eye,
} from "lucide-react";

const WA = "923222806245";
const SITE_URL = "https://autobrothers.pk"; // ← apni domain daalo

const waLink = (name: string, price?: string, url?: string) =>
  `https://wa.me/${WA}?text=${encodeURIComponent(
    `Salam! AutoBrothers mein "${name}"${price ? ` (${price})` : ""} ki detail chahiye.\n\n🔗 Product Link: ${url || ""}`
  )}`;

const condBadge = (c: string) =>
  c === "Good"
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : c === "Average"
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30";

export default function ProductClient({
  product,
  related,
  productId,
}: {
  product: any;
  related: any[];
  productId: string;
}) {
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = useState(false);

  const productUrl = `${SITE_URL}/product/${productId}`;

  /* ───── NOT FOUND ───── */
  if (!product) {
    return (
      <div className="min-h-screen bg-[#0A1929] flex items-center justify-center flex-col gap-4 px-4">
        <div className="text-6xl mb-2">😕</div>
        <h2 className="text-2xl font-bold text-white">Product Not Found</h2>
        <p className="text-sm text-gray-400 text-center max-w-md">
          Yeh product available nahi hai ya delete ho chuka hai.
        </p>
        <Link
          href="/#products"
          className="mt-4 inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold px-6 py-3 rounded-xl text-sm transition-all"
        >
          <ArrowLeft size={16} /> Back to Shop
        </Link>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     ███  PRODUCT DETAIL UI
     ═══════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#0A1929] pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#F5A623] mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT: IMAGE */}
          <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl overflow-hidden">
            <div className="relative aspect-[4/3] bg-[#0D1F30]">
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <img
                src={product.image || "https://picsum.photos/seed/default/800/600"}
                alt={product.title}
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImgLoaded(true)}
              />
              {product.condition && (
                <span
                  className={`absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-lg border ${condBadge(product.condition)}`}
                >
                  {product.condition}
                </span>
              )}
              {product.inStock === false && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-xl">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="flex flex-col">
            {/* Tags */}
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#F5A623] bg-[#F5A623]/10 px-3 py-1.5 rounded-lg border border-[#F5A623]/20">
                {product.category || "Auto Part"}
              </span>
              {product.featured && (
                <span className="text-[10px] font-bold tracking-wider uppercase text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20">
                  ⭐ Featured
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-4">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-extrabold text-[#F5A623]">
                {product.price || "Call for Price"}
              </span>
              {product.price && (
                <span className="text-xs text-gray-500">PKR</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#F5A623] rounded-full" />
                  Description
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line bg-[#13293D] border border-[#1E3A52] rounded-xl p-4">
                  {product.description}
                </p>
              </div>
            )}

            {/* Features Strip */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: Truck, title: "Free Delivery", sub: "All over Pakistan" },
                { icon: ShieldCheck, title: "100% Original", sub: "Japan Imported" },
                { icon: Wrench, title: "Warranty", sub: "Checking Warranty" },
                { icon: Phone, title: "24/7 Support", sub: "WhatsApp & Call" },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 bg-[#13293D] border border-[#1E3A52] rounded-xl p-3"
                  >
                    <Icon size={18} className="text-[#F5A623] flex-none" />
                    <div>
                      <div className="text-[11px] font-semibold text-white">
                        {f.title}
                      </div>
                      <div className="text-[9px] text-gray-500">{f.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* WhatsApp Order Button */}
            <a
              href={waLink(product.title, product.price, productUrl)}
              target="_blank"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-green-600 text-white font-bold py-4 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-95"
            >
              <MessageCircle size={20} /> Order on WhatsApp
            </a>

            {/* Call Option */}
            <a
              href="tel:03222806245"
              className="mt-4 text-center text-xs text-gray-500 hover:text-[#F5A623] transition-colors py-2"
            >
              📞 Ya call karein:{" "}
              <span className="font-semibold">0322-2806245</span>
            </a>
          </div>
        </div>

        {/* ═══════ RELATED PRODUCTS ═══════ */}
        {related.length > 0 && (
          <div className="mt-16 border-t border-[#1E3A52] pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">
                  {product.category}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Related Products
                </h3>
              </div>
              <Link
                href="/#products"
                className="text-xs text-[#F5A623] hover:text-[#D4911E] flex items-center gap-1 transition-colors"
              >
                View All <ArrowLeft size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#13293D] border border-[#1E3A52] rounded-xl overflow-hidden hover:border-[#F5A623]/40 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <Link href={`/product/${p.id}`}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#0D1F30]">
                      <img
                        src={p.image || "https://picsum.photos/seed/related/400/300"}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {p.condition && (
                        <span
                          className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md ${condBadge(p.condition)}`}
                        >
                          {p.condition}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link href={`/product/${p.id}`}>
                      <h4 className="text-xs font-semibold truncate group-hover:text-[#F5A623] transition-colors">
                        {p.title}
                      </h4>
                    </Link>

                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-sm font-bold text-[#F5A623]">
                        {p.price || "Call for Price"}
                      </span>
                      <Link
                        href={`/product/${p.id}`}
                        className="w-7 h-7 rounded-lg bg-[#1E3A52] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2A4A62] transition-all"
                      >
                        <Eye size={12} />
                      </Link>
                    </div>

                    <a
                      href={waLink(p.title, p.price, `${SITE_URL}/product/${p.id}`)}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white py-2 rounded-lg text-[10px] font-semibold transition-all"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Related - Browse All */}
        {related.length === 0 && (
          <div className="mt-16 border-t border-[#1E3A52] pt-8">
            <div className="bg-[#13293D] border border-[#1E3A52] rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400 mb-4">
                Aur parts chahiye? Sabhi products dekhein
              </p>
              <Link
                href="/#products"
                className="inline-flex items-center gap-2 bg-[#1E3A52] hover:bg-[#2A4A62] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all"
              >
                <ShoppingCart size={16} /> Browse All Products
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}