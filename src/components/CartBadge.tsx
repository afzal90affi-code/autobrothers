"use client";
import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartBadge() {
  const { totalItems } = useCart();
  return (
    <Link href="/cart" className="relative flex items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-[#F5A623] transition">
      <span className="text-xl">🛒</span>
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#F5A623] text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </Link>
  );
}