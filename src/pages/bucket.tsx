import { useState, FormEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import TopNav from '../components/TopNav'

const WA = '923222806245'
const SITE_URL = 'https://autobrothers.pk'

const formatOrderText = (items: any[], form: any) => {
  const lines = [
    'Salam! Main AutoBrothers se order karna chahta hoon.',
    `Naam: ${form.name}`,
    `Phone/WhatsApp: ${form.phone}`,
    `Shehar: ${form.city || '-'}`,
    `Address: ${form.address || '-'}`,
    `Note: ${form.note || '-'}`,
    '\nOrder Details:',
    ...items.map(item => `• ${item.title} x${item.quantity} ${item.price}`),
    `\nTotal: Rs ${items.reduce((sum, item) => sum + (Number((item.price || '').replace(/[^\d]/g, '')) || 0) * item.quantity, 0)}`,
    `\nLink: ${SITE_URL}/bucket`
  ]
  return lines.join('\n')
}

export default function BucketPage() {
  const { items, removeFromCart, updateQty, clearCart, totalItems, totalPrice } = useCart()
  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', note: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    const text = formatOrderText(items, form)
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank')
    setSent(true)
  }

  return (
    <>
      <Head>
        <title>Bucket | AutoBrothers</title>
        <meta name="description" content="Your bucket and order form for AutoBrothers." />
        <link rel="canonical" href={`${SITE_URL}/bucket`} />
      </Head>
      <TopNav />
      <main className="min-h-screen bg-[#0A1929] text-white py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#F5A623] uppercase tracking-[0.3em]">Bucket</p>
              <h1 className="text-3xl font-extrabold">Shop Cart & Order</h1>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">← Back to Shop</Link>
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl bg-[#13293D] border border-[#1E3A52] p-10 text-center">
              <p className="text-gray-400 mb-4">Aapka bucket abhi khaali hai.</p>
              <Link href="/" className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 px-6 rounded-2xl">Shop Now</Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[0.9fr_0.9fr]">
              <section className="rounded-3xl bg-[#13293D] border border-[#1E3A52] p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-xl">Bucket Items</h2>
                    <p className="text-sm text-gray-400">Total items: {totalItems}</p>
                  </div>
                  <button onClick={clearCart} className="text-sm text-gray-400 hover:text-white">Clear Bucket</button>
                </div>

                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="rounded-3xl bg-[#0D1F30] border border-[#1E3A52] p-4 grid gap-3 sm:grid-cols-[1fr_auto] items-center">
                      <div>
                        <h3 className="font-semibold text-sm">{item.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 rounded-xl bg-[#1E3A52] text-gray-400">−</button>
                        <span className="text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 rounded-xl bg-[#1E3A52] text-gray-400">+</button>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-xs">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl bg-[#0A1929] border border-[#1E3A52] p-5">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Estimated Total</span>
                    <strong className="text-white">Rs {totalPrice}</strong>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-[#13293D] border border-[#1E3A52] p-6">
                <h2 className="font-bold text-xl mb-4">Order Form</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase">Naam</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-2 w-full bg-[#0D1F30] border border-[#1E3A52] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5A623]" placeholder="Apna naam likhein" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase">WhatsApp Number</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full bg-[#0D1F30] border border-[#1E3A52] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5A623]" placeholder="0322xxxxxxx" type="tel" required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase">Shehar</label>
                    <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-2 w-full bg-[#0D1F30] border border-[#1E3A52] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5A623]" placeholder="Karachi" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase">Address</label>
                    <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-2 w-full bg-[#0D1F30] border border-[#1E3A52] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5A623]" placeholder="Address ya area" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase">Extra Note</label>
                    <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="mt-2 w-full bg-[#0D1F30] border border-[#1E3A52] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5A623]" rows={4} placeholder="Agar koi khas request ho..." />
                  </div>
                  <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold py-4 rounded-2xl">Send Order via WhatsApp <MessageCircle size={18} /></button>
                </form>
                {sent && <p className="mt-4 text-sm text-green-300">WhatsApp khol diya gaya. Apna order message bhej dein.</p>}
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
