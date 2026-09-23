"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function AddToCartButton({ product }: {
  product: { id: string; title: string; price: string; image: string; link: string; condition: string; description?: string };
}) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const add = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        {/* Qty selector */}
        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-10 h-12 text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >−</button>
          <span className="w-10 text-center font-bold text-gray-900 dark:text-white">{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="w-10 h-12 text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >+</button>
        </div>

        {/* Add button */}
        <button
          onClick={add}
          className={`flex-1 font-bold py-3 rounded-xl transition ${
            added ? "bg-green-500 text-white" : "bg-[#F5A623] hover:bg-[#e09612] text-black"
          }`}
        >
          {added ? "✓ Cart Mein Add Ho Gaya!" : `🛒 Add to Cart${qty > 1 ? ` (${qty})` : ""}`}
        </button>
      </div>

      {added && (
        <Link
          href="/cart"
          className="block text-center mt-3 text-sm font-semibold text-[#F5A623] hover:underline"
        >
          Cart Dekhein → Checkout karein
        </Link>
      )}
    </div>
  );
}