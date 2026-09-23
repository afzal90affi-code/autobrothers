"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import CarForm from "../../../components/admin/CarForm";
import BankForm from "../../../components/admin/BankForm";

export default function AdminNewCarsPage() {
  const [tab, setTab] = useState<"car" | "bank">("car");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="min-h-screen bg-[#0A1929] py-6 md:py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F5A623]">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">New Cars & Finance 🚗</h1>
            <p className="mt-1 text-xs text-gray-500">Save karte hi /new-cars page pe live ho jayega</p>
          </div>
          <Link href="/admin" className="shrink-0 rounded-xl border border-[#1E3A52] px-4 py-2 text-xs font-bold text-gray-300 hover:border-[#F5A623] hover:text-[#F5A623]">
            ← Dashboard
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-2">
          <button onClick={() => setTab("car")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${tab === "car" ? "bg-[#F5A623] text-[#0A1929]" : "bg-[#13293D] text-gray-400 border border-[#1E3A52] hover:text-[#F5A623]"}`}>
            🚗 Car
          </button>
          <button onClick={() => setTab("bank")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${tab === "bank" ? "bg-[#F5A623] text-[#0A1929]" : "bg-[#13293D] text-gray-400 border border-[#1E3A52] hover:text-[#F5A623]"}`}>
            🏦 Finance Bank
          </button>
        </div>

        {tab === "car" ? <CarForm key={refreshKey} onSaved={refresh} /> : <BankForm key={refreshKey} onSaved={refresh} />}
      </div>
    </div>
  );
}