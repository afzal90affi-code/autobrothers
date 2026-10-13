"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }: { product: any }) {
  const img = product.img ? `${product.img}?w=800&auto=format&q=70` : null;
  const { addToCart } = useCart();

  /* CONDITION SCORE */
  const scoreMap: Record<string, number> = { Good: 8, Average: 6, Bad: 3 };
  const conditionScore: number =
    typeof product.conditionScore === "number"
      ? product.conditionScore
      : (scoreMap[product.condition] ?? 0);

  const scoreColor =
    conditionScore >= 8
      ? "bg-green-500"
      : conditionScore >= 6
      ? "bg-amber-500"
      : "bg-red-500";

  /* ✅ Discount % + Savings calculate */
  const oldPriceNum = product.oldPrice ? Number(String(product.oldPrice).replace(/[^0-9]/g, "")) : 0;
  const newPriceNum = Number(String(product.price).replace(/[^0-9]/g, "")) || 0;
  const discount = oldPriceNum > newPriceNum ? Math.round(((oldPriceNum - newPriceNum) / oldPriceNum) * 100) : 0;
  /* ✅ NAYA: Savings amount — kitni bachat */
  const savings = discount > 0 ? oldPriceNum - newPriceNum : 0;

  /* Price formatted */
  const formattedPrice = newPriceNum ? newPriceNum.toLocaleString("en-PK") : product.price;
  const formattedOldPrice = oldPriceNum ? oldPriceNum.toLocaleString("en-PK") : "";

  /* SEO alt */
  const imgAlt = `${product.title}${product.condition ? ` — ${product.condition} condition ${conditionScore}/10` : ""} used auto part${
    product.model ? `, fits ${product.model}` : ""
  } — AutoBrothers Pakistan`;

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    addToCart(product);
    const btn = e.currentTarget;
    btn.textContent = "✓ Added!";
    setTimeout(() => (btn.textContent = "Add to Cart"), 1200);
  };

  return (
    <div
      className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
      itemScope
      itemType="https://schema.org/Product"
    >
      {/* ---------- IMAGE + BADGES ---------- */}
      <Link href={`/product/${product.slug}`} title={product.title}>
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
          {img && (
            <img
              src={img}
              alt={imgAlt}
              loading="lazy"
              width={800}
              height={800}
              itemProp="image"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          )}

          {/* SCORE badge — top-left */}
          {conditionScore > 0 && (
            <span className={`absolute top-2 left-2 text-[10px] font-black text-white px-2 py-1 rounded-md ${scoreColor} shadow-md`}>
              {conditionScore}/10
            </span>
          )}

          {/* ✅ DISCOUNT % badge — top-right (rose, flash jaisa) */}
          {discount > 0 && (
            <span className="absolute top-2 right-2 text-[11px] font-black px-2 py-1 rounded-md bg-rose-500 text-white shadow-lg">
              -{discount}%
            </span>
          )}

          {/* Condition label — sirf jab discount nahi (overlap na ho) */}
          {product.condition && discount === 0 && (
            <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur-sm">
              {product.condition}
            </span>
          )}

          {product.newArrival && (
            <span className="absolute bottom-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-blue-500 text-white shadow-md">
              New
            </span>
          )}
        </div>
      </Link>

      {/* ---------- INFO ---------- */}
      <div className="p-3 flex flex-col flex-1">
        {/* ✅ NAYA: Brand — chhota label title ke upar */}
        {product.brand && (
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#F5A623] mb-0.5">
            {product.brand}
          </p>
        )}

        <Link href={`/product/${product.slug}`} title={product.title}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#F5A623]" itemProp="name">
            {product.title}
          </h3>
        </Link>

        {/* ✅ NAYA: Part Number — mechanics ke liye (mono chip) */}
        {product.partNumber && (
          <p className="mt-1 text-[9px] font-mono font-semibold text-gray-500 dark:text-gray-400 truncate">
            🔧 {product.partNumber}
          </p>
        )}

        {product.model && (
          <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>🚗</span> Fits: {product.model}
          </p>
        )}

        {/* Trust chips */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {product.mileage && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              🛣 {product.mileage} km
            </span>
          )}
          {product.warranty && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              🛡 {product.warranty}d
            </span>
          )}
          {product.qualityChecked && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              ✅ Tested
            </span>
          )}
          {product.japanImported && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              🇯🇵 Japan
            </span>
          )}
        </div>

        {/* PRICE + ✅ SAVINGS */}
        <div className="mt-2 flex items-center gap-2 flex-wrap" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <meta itemProp="priceCurrency" content="PKR" />
          <meta itemProp="price" content={String(newPriceNum)} />
          <span className="text-[#F5A623] font-bold text-sm">Rs {formattedPrice}</span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">Rs {formattedOldPrice}</span>
          )}

          {product.inStock === false ? (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 text-red-500">Out of Stock</span>
          ) : (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400">In Stock</span>
          )}
        </div>

        {/* ✅ NAYA: Savings line — "Bachat Rs X" */}
        {discount > 0 && (
          <p className="mt-1 text-[10px] font-bold text-rose-500">
            💰 Aap bachayen: Rs {savings.toLocaleString("en-PK")}
          </p>
        )}

        {/* ADD TO CART */}
        <button
          onClick={handleAdd}
          disabled={product.inStock === false}
          className="mt-2 w-full py-2 rounded-xl bg-gray-900 dark:bg-[#F5A623] text-white dark:text-[#0A1929] text-xs font-bold hover:bg-[#D4911E] dark:hover:bg-[#FFB94D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Add ${product.title} to cart`}
        >
          {product.inStock === false ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}