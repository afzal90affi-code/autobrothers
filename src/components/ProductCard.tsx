"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }: { product: any }) {
  const img = product.img ? `${product.img}?w=800&auto=format&q=70` : null;
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    addToCart(product);
    const btn = e.currentTarget;
    btn.textContent = "✓ Added!";
    setTimeout(() => (btn.textContent = "Add to Cart"), 1200);
  };

  return (
    <div className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/product/${product.slug}`}>
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {img && <img src={img} alt={product.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#F5A623]">{product.title}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[#F5A623] font-bold text-sm">Rs {product.price}</span>
          {product.oldPrice && <span className="text-xs text-gray-400 line-through">Rs {product.oldPrice}</span>}
        </div>
        <button onClick={handleAdd}
          className="mt-2 w-full py-2 rounded-xl bg-gray-900 dark:bg-[#F5A623] text-white text-xs font-bold hover:bg-[#D4911E] transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
}