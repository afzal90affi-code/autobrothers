import { useState, useEffect, useRef } from "react"
import { writeClient } from "../../lib/sanityadmin"
import { X, Upload, Trash2, ImageIcon, Plus } from "lucide-react"

export default function AddProductForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [condition, setCondition] = useState("Good")
  const [featured, setFeatured] = useState(false)
  const [newArrival, setNewArrival] = useState(false)
  const [inStock, setInStock] = useState(true)
  const [subcatId, setSubcatId] = useState("")
  const [description, setDescription] = useState("")
  const [model, setModel] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [subcats, setSubcats] = useState<any[]>([])

  // Fetch subcategories
  useEffect(() => {
    const fetchSubcats = async () => {
      try {
        const data = await writeClient.fetch(
          `*[_type == "subcategory"] | order(title asc){ _id, title, "parent": parentCategory->title }`
        )
        setSubcats(data)
      } catch (error) {
        console.error("Failed to fetch subcategories:", error)
      }
    }
    fetchSubcats()
  }, [])

  // Handle file selection (from input or drag-drop)
  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))
    if (newFiles.length === 0) return

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))

    setImageFiles((prev) => [...prev, ...newFiles].slice(0, 8))
    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 8))
  }

  // Remove image at index
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  // Drag handlers
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const handleSave = async () => {
    if (!title || !subcatId) {
      alert("Title and Subcategory are required!")
      return
    }
    if (imageFiles.length === 0) {
      alert("Please add at least 1 product image!")
      return
    }

    setSaving(true)

    try {
      // 1. Upload all images to Sanity
      const uploadedAssets = []
      for (const file of imageFiles) {
        const asset = await writeClient.assets.upload("image", file, {
          filename: file.name,
        })
        uploadedAssets.push(asset)
      }

      // 2. Build images array
      const imagesArray = uploadedAssets.map((asset) => ({
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      }))

      // 3. Create Product Document
      await writeClient.create({
        _type: "product",
        title: title,
        slug: { _type: "slug", current: title.toLowerCase().replace(/\s+/g, "-").slice(0, 96) },
        price: price,
        condition: condition,
        featured: featured,
        newArrival: newArrival,
        inStock: inStock,
        description: description || undefined,
        model: model || undefined,
        subcategory: { _type: "reference", _ref: subcatId },
        images: imagesArray,
      })

      alert("Product Added Successfully!")
      // Cleanup previews before closing
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
      onClose()
    } catch (error) {
      console.error(error)
      alert("Failed to add product. Check console for details.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0A1929] border-l border-[#1E3A52] h-full overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#0A1929] pb-4 z-10">
          <div>
            <h2 className="text-xl font-bold">Add New Product</h2>
            <p className="text-xs text-gray-500 mt-1">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white hover:bg-[#13293D] p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Product Title *</label>
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
              <label className="text-xs text-gray-400 block mb-1.5">Price (Rs)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="25,000"
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Car Model</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="2015-2020"
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Sub Category *</label>
            <select
              value={subcatId}
              onChange={(e) => setSubcatId(e.target.value)}
              className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623] transition-colors"
            >
              <option value="">Select subcategory...</option>
              {subcats.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.title} {sub.parent ? `(${sub.parent})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Condition</label>
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
              Product Images * <span className="text-gray-600">({imageFiles.length}/8)</span>
            </label>

            {/* Drop zone */}
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
              <Upload size={20} className={dragActive ? "text-[#F5A623]" : "text-gray-500"} />
              <p className="text-xs text-gray-500 text-center">
                {dragActive ? "Drop images here" : "Click or drag images here"}
                <br />
                <span className="text-[10px] text-gray-600">PNG, JPG, WEBP (max 8)</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files)
                  e.target.value = "" // reset so same file can be selected again
                }}
              />
            </div>

            {/* Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {imagePreviews.map((src, i) => (
                  <div
                    key={i}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-[#1E3A52] bg-[#0D1F30]"
                  >
                    <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    {/* Image number badge */}
                    <div className="absolute top-1 left-1 bg-[#0A1929]/80 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {i + 1}
                    </div>
                    {/* Remove button */}
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
                    {/* First image indicator */}
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[#F5A623] text-[#0A1929] text-[8px] font-bold py-0.5 text-center">
                        MAIN
                      </div>
                    )}
                  </div>
                ))}

                {/* Add more button (if less than 8) */}
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
            <label className="text-xs text-gray-400 block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Product details, specifications, condition notes..."
              className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors resize-none"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 bg-[#13293D] border border-[#1E3A52] rounded-xl p-3">
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="text-gray-300">In Stock</span>
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="accent-[#F5A623] w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="text-gray-300">Featured Product</span>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="accent-[#F5A623] w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="text-gray-300">New Arrival</span>
              <input
                type="checkbox"
                checked={newArrival}
                onChange={(e) => setNewArrival(e.target.checked)}
                className="accent-[#F5A623] w-4 h-4"
              />
            </label>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] hover:from-[#FFB94D] hover:to-[#F5A623] text-[#0A1929] font-bold py-3 rounded-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F5A623]/20 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0A1929] border-t-transparent rounded-full animate-spin"></div>
                Uploading {imageFiles.length} images...
              </>
            ) : (
              <>
                <Plus size={16} /> Save Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}