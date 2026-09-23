"use client";

import { useState } from "react";
import { adminCreate, adminUploadImage } from "../../lib/adminApi";
import { Upload, X, Plus, Car } from "lucide-react";

export default function CarForm({ onSaved }: { onSaved?: () => void }) {
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [transmission, setTransmission] = useState("Automatic");
  const [fuel, setFuel] = useState("Petrol");
  const [featured, setFeatured] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const inputCls =
    "w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors";

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setPreview("");
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("Car name zaroori hai!");
    setSaving(true);
    try {
      let imageRef: any = undefined;
      if (imageFile) {
        // ✅ API route se upload (server pe token hai)
        const assetId = await adminUploadImage(imageFile);
        imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      }

      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);

      // ✅ API route se create
      await adminCreate({
        _type: "car",
        title: title.trim(),
        slug: { _type: "slug", current: `${baseSlug}-${Date.now().toString(36).slice(-4)}` },
        brand: brand.trim() || undefined,
        price: price.trim() || undefined,
        year: year.trim() || undefined,
        engine: engine.trim() || undefined,
        transmission: transmission,
        fuel: fuel,
        featured,
        image: imageRef,
      });

      alert("Car added! /new-cars pe live ho gayi");
      setTitle(""); setBrand(""); setPrice(""); setYear(""); setEngine("");
      setFeatured(false); removeImage();
      onSaved?.();
    } catch (e: any) {
      alert(e?.message || "Error saving car");
    }
    setSaving(false);
  };

  return (
    <div className="bg-[#0A1929] border border-[#1E3A52] rounded-2xl p-5 md:p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <Car size={18} className="text-[#F5A623]" /> Add New Car
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Car Name * (e.g. Toyota Corolla Altis)" className={`${inputCls} sm:col-span-2`} />
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand (Toyota)" className={inputCls} />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (7,499,000)" className={inputCls} />
        <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Model Year (2025)" className={inputCls} />
        <input value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="Engine (1300cc)" className={inputCls} />

        <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={inputCls}>
          <option>Automatic</option>
          <option>Manual</option>
          <option>CVT</option>
        </select>
        <select value={fuel} onChange={(e) => setFuel(e.target.value)} className={inputCls}>
          <option>Petrol</option>
          <option>Hybrid</option>
          <option>Diesel</option>
          <option>Electric</option>
        </select>
      </div>

      {/* Featured toggle */}
      <div className="flex items-center justify-between bg-[#13293D] border border-[#1E3A52] rounded-xl p-3.5">
        <span className="text-sm text-gray-300">Featured (homepage slider pe)</span>
        <button onClick={() => setFeatured(!featured)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${featured ? "bg-[#F5A623]" : "bg-[#1E3A52]"}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${featured ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Image upload */}
      <div className="border border-dashed border-[#1E3A52] rounded-xl p-4">
        {preview ? (
          <div className="flex items-center gap-3">
            <img src={preview} alt="Preview" className="h-20 w-32 rounded-lg object-cover" />
            <button onClick={removeImage} className="flex items-center gap-1 text-red-400 text-xs font-bold hover:text-red-300">
              <X size={14} /> Remove
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <Upload size={20} className="text-gray-500" />
            <span className="text-xs text-gray-500">Car image upload karo</span>
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
        )}
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] text-[#0A1929] font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? (
          <><div className="w-4 h-4 border-2 border-[#0A1929] border-t-transparent rounded-full animate-spin" /> Saving…</>
        ) : (
          <><Plus size={16} /> Save Car</>
        )}
      </button>
    </div>
  );
}