"use client";

import { useState } from "react";
import { adminCreate } from "../../lib/adminApi";
import { Plus, Building2 } from "lucide-react";

export default function BankForm({ onSaved }: { onSaved?: () => void }) {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [minDownPct, setMinDownPct] = useState("30");
  const [maxTenure, setMaxTenure] = useState("5");
  const [processingFee, setProcessingFee] = useState("");
  const [saving, setSaving] = useState(false);

  const inputCls =
    "w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors";

  const handleSave = async () => {
    if (!name.trim() || !rate) return alert("Bank name aur rate zaroori hain!");
    setSaving(true);
    try {
      await adminCreate({
        _type: "financeBank",
        name: name.trim(),
        rate: Number(rate),
        minDownPct: Number(minDownPct) || 30,
        maxTenure: Number(maxTenure) || 5,
        processingFee: processingFee.trim() || undefined,
      });
      alert("Bank added! /new-cars finance table mein live");
      setName(""); setRate(""); setProcessingFee("");
      onSaved?.();
    } catch (e: any) {
      alert(e?.message || "Error saving bank");
    }
    setSaving(false);
  };

  return (
    <div className="bg-[#0A1929] border border-[#1E3A52] rounded-2xl p-5 md:p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Building2 size={18} className="text-[#F5A623]" /> Add Finance Bank
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bank Name * (Meezan Bank)" className={inputCls} />
        <input type="number" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Interest Rate % * (18)" className={inputCls} />
        <input type="number" value={minDownPct} onChange={(e) => setMinDownPct(e.target.value)} placeholder="Min Down Payment % (30)" className={inputCls} />
        <input type="number" value={maxTenure} onChange={(e) => setMaxTenure(e.target.value)} placeholder="Max Tenure years (5)" className={inputCls} />
        <input value={processingFee} onChange={(e) => setProcessingFee(e.target.value)} placeholder="Processing Fee (Rs 15,000)" className={`${inputCls} sm:col-span-2`} />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] text-[#0A1929] font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? "Saving…" : (<><Plus size={16} /> Save Bank</>)}
      </button>
    </div>
  );
}