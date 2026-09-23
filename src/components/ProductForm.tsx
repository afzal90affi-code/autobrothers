"use client";
import { useState, useEffect, useRef } from "react"
import { adminCreate, adminUploadImage } from "../lib/adminApi"
import { X, Upload, Trash2, Plus } from "lucide-react"

export default function AddProductForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [condition, setCondition] = useState("Good")
  const [featured, setFeatured] = useState(false)
  const [newArrival, setNewArrival] = useState(false)
  const [inStock, setInStock] = useState(true)
  const [catId, setCatId] = useState("")
  const [subcatId, setSubcatId] = useState("")
  const [description, setDescription] = useState("")
  const [model, setModel] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [subcats, setSubcats] = useState<any[]>([])

  // Fetch categories + subcategories (read — client se theek hai)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const cats = await fetch("/api/get-data?type=categories").then(r => r.json()).catch(() => null)
        // Agar get-data API nahi hai toh direct read client use karo:
        let catsData = cats?.success ? cats.data : null
        let subsData: any[] = []

        if (!catsData) {
          // Fallback: read client (agar available hai) ya phir empty
          catsData = []
        }

        try {
          const subsRes = await fetch("/api/get-data?type=subcategories").then(r => r.json())
          subsData = subsRes?.success ? subsRes.data : []
        } catch { subsData = [] }

        setCategories(catsData || [])
        setSubcats(subsData)
      } catch (error) {
        console.error("Fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtered subcategories
  const filteredSubcats = catId
    ? subcats.filter((sub) => sub.parentCatId === catId || sub.parentId === catId)
    : []

  const handleCatChange = (id: string) => {
    setCatId(id)
    setSubcatId("")
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    )
    if (newFiles.length === 0) return
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setImageFiles((prev) => [...prev, ...newFiles].slice(0, 8))
    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 8))
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    if (!title || !catId || !subcatId) {
      alert("Title, Category aur Subcategory zaruri hain!")
      return
    }
    if (imageFiles.length === 0) {
      alert("Kam az kam 1 image upload karo!")
      return
    }

    setSaving(true)

    try {
      // ✅ Images API route se upload karo (server pe token hai)
      const assetIds: string[] = []
      for (const file of imageFiles) {
        const assetId = await adminUploadImage(file)
        assetIds.push(assetId)
      }

      const imagesArray = assetIds.map((id) => ({
        _type: "image",
        asset: { _type: "reference", _ref: id },
      }))

      // ✅ Product API route se save karo
      await adminCreate({
        _type: "product",
        title: title,
        slug: {
          _type: "slug",
          current:
            title
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
              .slice(0, 90) +
            "-" +
            Date.now().toString(36).slice(-4),
        },
        price: price,
        condition: condition,
        featured: featured,
        newArrival: newArrival,
        inStock: inStock,
        description: description || undefined,
        model: model || undefined,
        subcategory: { _type: "reference", _ref: subcatId },
        images: imagesArray,
        publishedAt: date,
      })

      alert("Product successfully add ho gaya!")
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
      onClose()
    } catch (error: any) {
      console.error(error)
      alert("Product add nahi hua: " + (error?.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0A1929] border-l border-[#1E3A52] h-full overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#0A1929] pb-4 z-10">
          <div>
            <h2 className="text-xl font-bold">Add New Product</h2>
            <p className="text-xs text-gray-500 mt-1">
              Fill in the details below
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white hover:bg-[#13293D] p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Loading categories...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Product Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g Toyota Corolla Engine"
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>

            {/* Price & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  Price (Rs)
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="25,000"
                  className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  Car Model
                </label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="2015-2020"
                  className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
                />
              </div>
            </div>

            {/* Date field */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Listing Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>

            {/* CATEGORY DROPDOWN */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Category *
              </label>
              <select
                value={catId}
                onChange={(e) => handleCatChange(e.target.value)}
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623] transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239CA3AF' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                }}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.title}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-[10px] text-rose-400 mt-1.5 pl-1">
                  Koi category nahi mili. Pehle categories banao.
                </p>
              )}
            </div>

            {/* SUBCATEGORY DROPDOWN */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Sub Category *
                {catId && filteredSubcats.length > 0 && (
                  <span className="text-[#F5A623] ml-1">
                    ({filteredSubcats.length} found)
                  </span>
                )}
              </label>
              <select
                value={subcatId}
                onChange={(e) => setSubcatId(e.target.value)}
                disabled={!catId}
                className={`w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm focus:outline-none transition-colors appearance-none ${
                  !catId
                    ? "text-gray-600 cursor-not-allowed opacity-50"
                    : "text-white focus:border-[#F5A623] cursor-pointer"
                }`}
                style={
                  catId
                    ? {
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239CA3AF' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 16px center",
                      }
                    : {}
                }
              >
                <option value="">
                  {!catId
                    ? "Pehle category select karo..."
                    : filteredSubcats.length === 0
                    ? "Is category mein koi subcategory nahi"
                    : "-- Select Sub Category --"}
                </option>
                {filteredSubcats.map((sub: any) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.title}
                  </option>
                ))}
              </select>
              {catId && filteredSubcats.length === 0 && (
                <p className="text-[10px] text-amber-400/80 mt-1.5 pl-1">
                  Is category ke under koi subcategory nahi hai. Pehle
                  subcategories add karo.
                </p>
              )}
            </div>

            {/* Condition */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Condition
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Good", "Average", "Bad"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      condition === c
                        ? c === "Good"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                          : c === "Average"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/50"
                        : "bg-[#13293D] text-gray-500 border border-[#1E3A52] hover:border-[#F5A623]/30"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Image Upload */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Product Images *{" "}
                <span className="text-gray-600">
                  ({imageFiles.length}/8)
                </span>
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 w-full h-32 bg-[#13293D] border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  dragActive
                    ? "border-[#F5A623] bg-[#F5A623]/5"
                    : "border-[#1E3A52] hover:border-[#F5A623]/50"
                }`}
              >
                <Upload
                  size={20}
                  className={dragActive ? "text-[#F5A623]" : "text-gray-500"}
                />
                <p className="text-xs text-gray-500 text-center">
                  {dragActive
                    ? "Drop images here"
                    : "Click or drag images here"}
                  <br />
                  <span className="text-[10px] text-gray-600">
                    PNG, JPG, WEBP (max 8)
                  </span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {imagePreviews.map((src, i) => (
                    <div
                      key={i}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-[#1E3A52] bg-[#0D1F30]"
                    >
                      <img
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-[#0A1929]/80 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {i + 1}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(i)
                        }}
                        className="absolute top-1 right-1 bg-rose-500/90 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                      {i === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-[#F5A623] text-[#0A1929] text-[8px] font-bold py-0.5 text-center">
                          MAIN
                        </div>
                      )}
                    </div>
                  ))}
                  {imageFiles.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-[#1E3A52] hover:border-[#F5A623]/50 flex items-center justify-center text-gray-600 hover:text-[#F5A623] transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Product details, specifications, condition notes..."
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors resize-none"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 bg-[#13293D] border border-[#1E3A52] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">In Stock</span>
                  {inStock && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      AVAILABLE
                    </span>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1E3A52] rounded-full peer peer-checked:bg-emerald-500 transition-colors relative">
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        inStock ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>
              </div>
              <div className="h-px bg-[#1E3A52]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">
                    Featured Product
                  </span>
                  {featured && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F5A623]/20 text-[#F5A623]">
                      FEATURED
                    </span>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1E3A52] rounded-full peer peer-checked:bg-[#F5A623] transition-colors relative">
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        featured ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>
              </div>
              <div className="h-px bg-[#1E3A52]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">New Arrival</span>
                  {newArrival && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                      NEW
                    </span>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newArrival}
                    onChange={(e) => setNewArrival(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1E3A52] rounded-full peer peer-checked:bg-blue-500 transition-colors relative">
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        newArrival ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] hover:from-[#FFB94D] hover:to-[#F5A623] text-[#0A1929] font-bold py-3 rounded-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F5A623]/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A1929] border-t-transparent rounded-full animate-spin" />
                  Uploading {imageFiles.length} images...
                </>
              ) : (
                <>
                  <Plus size={16} /> Save Product
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}