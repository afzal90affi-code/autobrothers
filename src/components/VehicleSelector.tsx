"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { client } from "../lib/sanityClient";
import { Search, ChevronRight, Car, X, ArrowLeft } from "lucide-react";

type Prod = {
  _id: string;
  title: string;
  slug: string;
  price: string;
  image?: string;
  model?: string;
};

export default function VehicleSelector({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"make" | "model" | "results">("make");
  const [prods, setProds] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  /* Saare products fetch — model field se makes/models derive honge */
  useEffect(() => {
    client
      .fetch<Prod[]>(
        `*[_type == "product" && defined(slug.current) && inStock != false] {
          _id, title, "slug": slug.current, price, model,
          "image": images[0].asset->url
        }`
      )
      .then((d) => setProds(d || []))
      .catch(() => setProds([]))
      .finally(() => setLoading(false));
  }, []);

  /* Unique models nikalo (model field se) */
  const allModels = useMemo(() => {
    const set = new Set<string>();
    prods.forEach((p) => {
      const m = (p.model || "").trim();
      if (m) set.add(m);
    });
    return Array.from(set).sort();
  }, [prods]);

  /* Make = model string ka pehla word */
  const makes = useMemo(() => {
    const set = new Set<string>();
    allModels.forEach((m) => set.add(m.split(" ")[0]));
    return Array.from(set).sort();
  }, [allModels]);

  /* Selected make ke models */
  const modelsForMake = useMemo(
    () => allModels.filter((m) => m.toLowerCase().startsWith(selectedMake.toLowerCase())),
    [allModels, selectedMake]
  );

  /* Results — selected model wale products */
  const results = useMemo(
    () =>
      prods.filter((p) =>
        (p.model || "").toLowerCase().includes(selectedModel.toLowerCase()) &&
        (!search ||
          p.title.toLowerCase().includes(search.toLowerCase()))
      ),
    [prods, selectedModel, search]
  );

  /* Search suggestions */
  const filteredMakes = useMemo(
    () => (search ? makes.filter((m) => m.toLowerCase().includes(search.toLowerCase())) : makes),
    [makes, search]
  );

  const filteredModels = useMemo(
    () =>
      search
        ? modelsForMake.filter((m) => m.toLowerCase().includes(search.toLowerCase()))
        : modelsForMake,
    [modelsForMake, search]
  );

  const cls =
    "w-full rounded-xl border border-gray-200 dark:border-[#1E3A52] bg-gray-50 dark:bg-[#13293D] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-[#F5A623]";

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#0D1F30] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

        {/* ===== Header ===== */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E3A52] p-4">
          <div className="flex items-center gap-2">
            {step === "model" && (
              <button
                onClick={() => { setStep("make"); setSearch(""); }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#13293D] transition"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Car size={16} className="text-[#F5A623]" />
                Select Your Car
              </h2>
              <p className="text-[10px] text-gray-400">
                {step === "make" ? "Apni gari ki brand/model likho" : `${selectedMake} — model chuno`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#13293D] transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ===== Search bar ===== */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                step === "make"
                  ? "Gari ka naam likho... (e.g. Corolla, Civic)"
                  : `${selectedMake} ka model... (e.g. 2020, GLi)`
              }
              className={cls + " pl-10"}
            />
          </div>
        </div>

        {/* ===== Content ===== */}
        <div className="max-h-[55vh] overflow-y-auto px-4 pb-6">
          {loading ? (
            <div className="space-y-2 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-[#13293D]" />
              ))}
            </div>
          ) : step === "make" ? (
            /* ===== STEP 1: Makes ===== */
            filteredMakes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Koi make nahi mila — products add karte waqt Car Model field bharti hain.
              </p>
            ) : (
              <div className="space-y-1.5 pt-2">
                {filteredMakes.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMake(m);
                      setSearch("");
                      setStep("model");
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-100 dark:border-[#1E3A52] bg-gray-50 dark:bg-[#13293D] px-4 py-3.5 text-left transition hover:border-[#F5A623]/50 hover:bg-amber-50 dark:hover:bg-[#0D1F30]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5A623]/15 text-sm font-black text-[#F5A623]">
                        {m.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{m}</span>
                    </span>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                  </button>
                ))}
              </div>
            )
          ) : step === "model" ? (
            /* ===== STEP 2: Models ===== */
            filteredModels.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Is brand ka koi model nahi mila.</p>
            ) : (
              <div className="space-y-1.5 pt-2">
                {filteredModels.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedModel(m);
                      setSearch("");
                      setStep("results");
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-100 dark:border-[#1E3A52] bg-gray-50 dark:bg-[#13293D] px-4 py-3.5 text-left transition hover:border-[#F5A623]/50 hover:bg-amber-50 dark:hover:bg-[#0D1F30]"
                  >
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{m}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#F5A623]">
                      {prods.filter((p) => p.model === m).length} parts
                      <ChevronRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : (
            /* ===== STEP 3: Results ===== */
            <div className="pt-2">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {selectedModel} — {results.length} parts mile
                </p>
                <button
                  onClick={() => setStep("model")}
                  className="text-[11px] font-bold text-[#F5A623]"
                >
                  Change
                </button>
              </div>

              {results.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 dark:border-[#1E3A52] py-10 text-center text-sm text-gray-400">
                  Is gari ke liye abhi parts nahi — WhatsApp karo, mil jayega!
                </p>
              ) : (
                <div className="space-y-2">
                  {results.map((p) => (
                    <Link
                      key={p._id}
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-[#1E3A52] bg-gray-50 dark:bg-[#13293D] p-2.5 transition hover:border-[#F5A623]/50"
                    >
                      {p.image ? (
                        <img src={`${p.image}?w=120&h=120&fit=crop`} alt={p.title} className="h-14 w-14 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1E3A52] text-xl">📦</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-bold text-gray-900 dark:text-white">{p.title}</p>
                        <p className="text-xs font-black text-[#F5A623]">Rs {Number(p.price || 0).toLocaleString("en-PK")}</p>
                      </div>
                      <ChevronRight size={15} className="text-gray-300 dark:text-gray-600" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}