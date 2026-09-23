"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, MessageCircle, Fuel, Gauge, Settings2, Calendar } from "lucide-react";

const WA = "923222806245";
const SITE_URL = "https://autobrothers.pk";

type Car = {
  _id: string; title: string; slug: string; brand?: string;
  price?: string; image?: string; year?: string; engine?: string;
  transmission?: string; fuel?: string; featured?: boolean;
};
type Bank = { _id: string; name: string; rate: number; minDownPct: number; maxTenure: number; processingFee?: string };

const fmtPKR = (n: number) => n.toLocaleString("en-PK");

/* ============================================================
   EMI CALCULATOR
   ============================================================ */
function FinanceCalculator({ banks, cars }: { banks: Bank[]; cars: Car[] }) {
  const parsePrice = (p?: string) => Number((p || "").replace(/[^\d]/g, "")) || 0;

  const [carPrice, setCarPrice] = useState(3000000);
  const [downPct, setDownPct] = useState(30);
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(banks[0]?.rate ?? 20);

  const downPayment = Math.round((carPrice * downPct) / 100);
  const financed = carPrice - downPayment;
  const months = years * 12;
  const r = rate / 12 / 100;

  const emi = useMemo(() => {
    if (financed <= 0 || months <= 0) return 0;
    if (r === 0) return Math.round(financed / months);
    const f = Math.pow(1 + r, months);
    return Math.round((financed * r * f) / (f - 1));
  }, [financed, months, r]);

  const totalPayable = emi * months + downPayment;
  const totalMarkup = emi * months - financed;

  const inputCls =
    "w-full px-3 py-2.5 bg-white dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#F5A623] transition-colors";
  const labelCls = "text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 block";

  const waApply = encodeURIComponent(
    `Assalam o Alaikum! Car finance chahiye:\n\n🚗 Car Price: PKR ${fmtPKR(carPrice)}\n💵 Down Payment: ${downPct}% (PKR ${fmtPKR(downPayment)})\n📅 Tenure: ${years} years\n📊 Expected Rate: ${rate}%\n\nMonthly EMI approx: PKR ${fmtPKR(emi)}\n\nPlease guide me further.`
  );

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* ---------- Inputs ---------- */}
      <div className="lg:col-span-3 bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-[#1E3A52] p-5 space-y-5">
        {/* Car select/price */}
        <div>
          <label className={labelCls}>🚗 Car Price (PKR)</label>
          {cars.length > 0 && (
            <select
              onChange={(e) => {
                const c = cars.find((x) => x._id === e.target.value);
                if (c?.price) setCarPrice(parsePrice(c.price));
              }}
              className={`${inputCls} mb-3`}
              defaultValue=""
            >
              <option value="">— Ya list se car chuno —</option>
              {cars.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} {c.price ? `(PKR ${c.price})` : ""}
                </option>
              ))}
            </select>
          )}
          <input
            type="number" min={500000} step={50000} value={carPrice || ""}
            onChange={(e) => setCarPrice(Number(e.target.value) || 0)}
            placeholder="3000000" className={inputCls}
          />
        </div>

        {/* Down payment */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className={`${labelCls} mb-0`}>💵 Down Payment</label>
            <span className="text-xs font-black text-[#F5A623]">{downPct}% — PKR {fmtPKR(downPayment)}</span>
          </div>
          <input
            type="range" min={20} max={70} step={5} value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="w-full accent-[#F5A623] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>20%</span><span>70%</span>
          </div>
        </div>

        {/* Tenure */}
        <div>
          <label className={labelCls}>📅 Tenure</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((y) => (
              <button key={y} onClick={() => setYears(y)}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  years === y
                    ? "bg-[#F5A623] text-[#0A1929]"
                    : "bg-gray-100 dark:bg-[#13293D] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#1E3A52] hover:text-[#F5A623]"
                }`}>
                {y}y
              </button>
            ))}
          </div>
        </div>

        {/* Rate */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className={`${labelCls} mb-0`}>📊 Interest Rate (per year)</label>
            <span className="text-xs font-black text-[#F5A623]">{rate}%</span>
          </div>
          <input
            type="range" min={10} max={30} step={0.5} value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-[#F5A623] cursor-pointer"
          />
          {/* Bank quick-select */}
          {banks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {banks.slice(0, 5).map((b) => (
                <button key={b._id} onClick={() => setRate(b.rate)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                    rate === b.rate
                      ? "bg-[#F5A623] text-[#0A1929]"
                      : "bg-gray-100 dark:bg-[#13293D] text-gray-500 dark:text-gray-400 hover:text-[#F5A623]"
                  }`}>
                  {b.name} ({b.rate}%)
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Result card ---------- */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-24 bg-gradient-to-br from-[#13293D] to-[#0A1929] rounded-2xl border border-[#1E3A52] p-6 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F5A623]">Monthly Installment</p>
          <p className="mt-2 text-4xl font-black text-[#F5A623]">
            PKR {fmtPKR(emi)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">for {months} months</p>

          <div className="mt-5 space-y-2.5 text-sm border-t border-white/10 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Car Price</span>
              <span className="font-bold">PKR {fmtPKR(carPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Down Payment ({downPct}%)</span>
              <span className="font-bold">PKR {fmtPKR(downPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Financed Amount</span>
              <span className="font-bold">PKR {fmtPKR(financed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Markup</span>
              <span className="font-bold text-red-400">PKR {fmtPKR(Math.max(0, totalMarkup))}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2.5">
              <span className="text-gray-400">Total Payable</span>
              <span className="font-black text-white">PKR {fmtPKR(totalPayable)}</span>
            </div>
          </div>

          <a href={`https://wa.me/${WA}?text=${waApply}`} target="_blank" rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition">
            <MessageCircle size={16} /> Finance Pe Apply Karein
          </a>
          <p className="text-[10px] text-gray-500 text-center mt-2">
            * Estimate hai — final rate bank approval pe depend karta hai
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
function NewCarsContent() {
  const [cars, setCars] = useState<Car[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState("all");

  useEffect(() => {
    import("../../lib/sanityClient").then(({ client }) => {
      client
        .fetch<Car[]>(
          `*[_type == "car" && defined(slug.current)] | order(coalesce(order, 9999) asc, price asc){
            _id, title, "slug": slug.current, brand, price,
            "image": image.asset->url, year, engine, transmission, fuel, featured
          }`
        )
        .then(setCars)
        .catch(() => {});
      client
        .fetch<Bank[]>(
          `*[_type == "financeBank"] | order(coalesce(order, 9999) asc, rate asc){ _id, name, rate, minDownPct, maxTenure, processingFee }`
        )
        .then(setBanks)
        .catch(() => {});
      setLoading(false);
    });
  }, []);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    cars.forEach((c) => { if (c.brand) map.set(c.brand, (map.get(c.brand) || 0) + 1); });
    return Array.from(map.entries());
  }, [cars]);

  const filtered = brandFilter === "all" ? cars : cars.filter((c) => c.brand === brandFilter);
  const featured = cars.filter((c) => c.featured).slice(0, 6);

  /* JSON-LD */
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "New Cars Pakistan",
    numberOfItems: cars.length,
    itemListElement: cars.slice(0, 25).map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.title,
      url: `${SITE_URL}/new-cars#${c.slug}`,
    })),
  };

  const specIcon = (c: Car) => (
    <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
      {c.year && <span className="inline-flex items-center gap-1"><Calendar size={11} />{c.year}</span>}
      {c.engine && <span className="inline-flex items-center gap-1"><Gauge size={11} />{c.engine}</span>}
      {c.transmission && <span className="inline-flex items-center gap-1"><Settings2 size={11} />{c.transmission}</span>}
      {c.fuel && <span className="inline-flex items-center gap-1"><Fuel size={11} />{c.fuel}</span>}
    </div>
  );

  return (
    <main className="min-h-screen bg-white dark:bg-[#0A1929]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1929] via-[#112240] to-[#0A1929] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20 text-center">
          <span className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase text-[#F5A623] bg-[#F5A623]/10 px-3 py-1.5 rounded-full border border-[#F5A623]/20">
            🚗 AutoBrothers Motors
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
            New Cars & <span className="text-[#F5A623]">Car Finance</span>
          </h1>
          <p className="mt-3 max-w-xl mx-auto text-sm md:text-base text-gray-300">
            2025 models, on-wall prices — aur EMI calculator se apni installment khud calculate karo.
            Bank rates compare karo, WhatsApp pe booking karo.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <a href="#cars" className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#FFB94D] text-[#0A1929] font-bold px-6 py-3 rounded-xl text-sm transition">
              Browse Cars <ArrowRight size={15} />
            </a>
            <a href="#finance" className="inline-flex items-center gap-2 border border-white/25 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold px-6 py-3 rounded-xl text-sm transition">
              <Calculator size={15} /> EMI Calculator
            </a>
          </div>
        </div>
      </section>

      {/* ================= FEATURED CARS ================= */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Featured</span>
              <h2 className="text-xl md:text-2xl font-bold mt-1 text-gray-900 dark:text-white">Hot Picks 🔥</h2>
            </div>
            <a href="#cars" className="text-xs text-[#F5A623]">View All →</a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((c) => (
              <div key={c._id} id={c.slug} className="flex-none w-[240px] sm:w-[280px]">
                <CarCard car={c} specs={specIcon(c)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= ALL CARS ================= */}
      <section id="cars" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-6">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Showroom</span>
          <h2 className="text-2xl md:text-3xl font-bold mt-1 text-gray-900 dark:text-white">All New Cars</h2>
        </div>

        {/* Brand chips */}
        {brands.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <button onClick={() => setBrandFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                brandFilter === "all" ? "bg-[#F5A623] text-[#0A1929]" : "bg-gray-100 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] text-gray-600 dark:text-gray-400 hover:text-[#F5A623]"
              }`}>
              All Brands
            </button>
            {brands.map(([b, count]) => (
              <button key={b} onClick={() => setBrandFilter(brandFilter === b ? "all" : b)}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  brandFilter === b ? "bg-[#F5A623] text-[#0A1929]" : "bg-gray-100 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] text-gray-600 dark:text-gray-400 hover:text-[#F5A623]"
                }`}>
                {b} ({count})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#13293D]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-[#1E3A52] py-16 text-center">
            <span className="text-5xl">🚗</span>
            <h3 className="mt-4 font-bold text-lg text-gray-900 dark:text-white">Abhi koi car listed nahi</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              Sanity Studio mein <code className="text-[#F5A623]">car</code> documents add karo — yahan auto show honge.
              Filhaal neeche EMI calculator use kar sakte ho!
            </p>
            <a href="#finance" className="mt-5 inline-block rounded-xl bg-[#F5A623] px-6 py-2.5 text-sm font-bold text-[#0A1929]">
              <Calculator size={14} className="inline mr-1" /> EMI Calculator
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <CarCard key={c._id} car={c} specs={specIcon(c)} />
            ))}
          </div>
        )}
      </section>

      {/* ================= FINANCE CALCULATOR ================= */}
      <section id="finance" className="bg-gray-50 dark:bg-[#0D1F30]/60 py-14 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F5A623]">Car Finance</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-1 text-gray-900 dark:text-white">
              📊 EMI Calculator
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Down payment, tenure aur rate adjust karo — monthly installment foran calculate hogi
            </p>
          </div>

          <FinanceCalculator banks={banks} cars={cars} />

          {/* ---------- Bank comparison table ---------- */}
          {banks.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                🏦 Bank Finance Comparison
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-[#1E3A52]">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-[#13293D] text-left">
                      <th className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200">Bank</th>
                      <th className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200">Rate (p.a.)</th>
                      <th className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200">Min Down</th>
                      <th className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200">Max Tenure</th>
                      <th className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200">Processing Fee</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {banks.map((b) => (
                      <tr key={b._id} className="border-t border-gray-100 dark:border-[#1E3A52] bg-white dark:bg-[#112240]">
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{b.name}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-[#F5A623]/15 text-[#F5A623] px-2.5 py-0.5 text-xs font-black">
                            {b.rate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{b.minDownPct}%</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{b.maxTenure} years</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{b.processingFee || "—"}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://wa.me/${WA}?text=${encodeURIComponent(`Assalam o Alaikum! ${b.name} se car finance ki details chahiye.`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 text-[11px] font-bold hover:bg-green-500 hover:text-white transition"
                          >
                            <MessageCircle size={12} /> Apply
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-gray-400">
                * Rates indicative hain — bank ki final approval pe depend karte hain. KIBOR ke sath change ho sakte hain.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          Koi sawal? Seedha rabta karein
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Booking, finance ya kisi bhi car ki detail — WhatsApp pe foran jawab
        </p>
        <a href={`https://wa.me/${WA}`} target="_blank" rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-500 hover:bg-green-600 px-8 py-3.5 text-sm font-bold text-white transition">
          <MessageCircle size={16} /> WhatsApp: 0322-2806245
        </a>
      </section>
    </main>
  );
}

/* ============================================================
   CAR CARD
   ============================================================ */
function CarCard({ car, specs }: { car: Car; specs: React.ReactNode }) {
  const wa = encodeURIComponent(
    `Assalam o Alaikum! Ye car chahiye:\n\n🚗 ${car.title}${car.price ? `\n💰 Price: PKR ${car.price}` : ""}${car.year ? `\n📅 Model: ${car.year}` : ""}\n\nDetail aur booking ke bare mein batao.`
  );

  return (
    <article
      className="group h-full flex flex-col bg-white dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-2xl overflow-hidden hover:border-[#F5A623]/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_-10px_rgba(245,166,35,0.15)] transition-all duration-300"
      id={car.slug}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-[#0D1F30]">
        {car.image ? (
          <img
            src={`${car.image}?w=800&auto=format&q=75`}
            alt={car.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex w-full h-full items-center justify-center text-5xl">🚗</div>
        )}
        {car.featured && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-orange-500/85 text-white backdrop-blur-sm">
            🔥 Featured
          </span>
        )}
        {car.brand && (
          <span className="absolute top-2 left-2 text-[9px] font-bold px-2.5 py-0.5 rounded-md bg-white/90 dark:bg-[#0A1929]/85 backdrop-blur-sm text-gray-800 dark:text-[#F5A623] uppercase tracking-widest">
            {car.brand}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white group-hover:text-[#F5A623] transition-colors">
          {car.title}
        </h3>
        {specs}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="text-base sm:text-lg font-black text-[#F5A623]">
            {car.price ? `PKR ${car.price}` : "On Request"}
          </span>
          <a
            href={`https://wa.me/${WA}?text=${wa}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white px-3.5 py-2 text-[11px] font-bold transition"
          >
            <MessageCircle size={13} /> Book
          </a>
        </div>
        {/* Finance hint */}
        <a href="#finance" className="mt-2 text-center text-[10px] font-bold text-gray-400 hover:text-[#F5A623] transition">
          📊 Is car ki EMI calculate karo
        </a>
      </div>
    </article>
  );
}

/* ============================================================
   Suspense wrapper
   ============================================================ */
export default function NewCarsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-[#0A1929] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5A623] border-t-transparent" />
        </div>
      }
    >
      <NewCarsContent />
    </Suspense>
  );
}
