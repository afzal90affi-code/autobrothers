"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";

const WHATSAPP_NUMBER = "923222806245"; // ✅ product page wala same number

export default function CartPage() {
  const { items, removeFromCart, updateQty, clearCart, totalPrice } = useCart();

  const totalQty = items.reduce((s: number, it: any) => s + (it.quantity || 1), 0);

  const orderOnWhatsApp = () => {
    const lines = items
      .map(
        (it, i) =>
          `${i + 1}. ${it.title}\n   Qty: ${it.quantity || 1} × Rs ${it.price}${
            it.condition ? ` | Condition: ${it.condition}` : ""
          }\n   ${it.link || ""}`
      )
      .join("\n\n");
    const msg = `Assalam o Alaikum! Mujhe ye order karna hai:\n\n${lines}\n\n💰 *Total: Rs ${totalPrice.toLocaleString("en-PK")}*`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-gray-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#F5A623]">Home</Link>
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300">Cart</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🛒 Aapka Cart</h1>

        {!items.length ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🛒</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Cart khali hai</p>
            <Link href="/products" className="inline-block bg-[#F5A623] text-[#0A1929] font-bold px-6 py-3 rounded-xl transition hover:bg-[#D4911E]">
              Parts Dekhein →
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {items.map((it) => (
                <div key={it.id} className="flex gap-4 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                  {it.image && (
                    <img
                      src={`${it.image}?w=200&auto=format&q=70`}
                      alt={it.title}
                      className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${it.id}`} className="font-semibold text-gray-900 dark:text-white line-clamp-1 hover:text-[#F5A623]">
                      {it.title}
                    </Link>
                    {it.condition && <p className="text-xs text-gray-400 mt-0.5">Condition: {it.condition}</p>}
                    <p className="text-[#F5A623] font-bold mt-1">Rs {it.price}</p>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-sm">
                        {/* ✅ BUG FIX: `it.quantity? - 1` syntax error tha */}
                        <button
                          onClick={() => updateQty(it.id, Math.max(1, (it.quantity || 1) - 1))}
                          className="w-8 h-8 font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold">{it.quantity || 1}</span>
                        <button
                          onClick={() => updateQty(it.id, (it.quantity || 1) + 1)}
                          className="w-8 h-8 font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(it.id)} className="text-xs text-red-500 hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    Rs {((Number((it.price || "").replace(/[^\d]/g, "")) || 0) * (it.quantity || 1)).toLocaleString("en-PK")}
                  </p>
                </div>
              ))}
            </div>

            {/* Total + Checkout */}
            <div className="mt-8 border-t-2 border-gray-100 dark:border-gray-800 pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  {items.length} product(s) • {totalQty} item(s)
                </span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">Total</span>
                <span className="text-3xl font-extrabold text-[#F5A623]">
                  Rs {totalPrice.toLocaleString("en-PK")}
                </span>
              </div>

              <button
                onClick={orderOnWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg transition"
              >
                📱 WhatsApp Pe Order Karein
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                Order details seedha WhatsApp pe jayenge — delivery aur payment wahan confirm hogi
              </p>

              {/* Trust badges */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500 dark:text-gray-400">
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl py-2.5">✅ Quality Checked</div>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl py-2.5">🚚 All Pakistan Delivery</div>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl py-2.5">🔄 7-Day Return</div>
              </div>

              <div className="flex gap-3 mt-4">
                <Link href="/products" className="flex-1 text-center border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition hover:border-[#F5A623] hover:text-[#F5A623]">
                  Aur Parts Dekhein
                </Link>
                <button
                  onClick={clearCart}
                  className="flex-1 text-red-500 font-semibold py-3 rounded-xl border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  Cart Khali Karein
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}