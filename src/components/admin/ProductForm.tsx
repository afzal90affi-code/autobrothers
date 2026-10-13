"use client";
import { useState, useEffect, useRef } from "react"
import { adminCreate, adminUpdate, adminUploadImage } from "../../lib/adminApi"
import { client } from "../../lib/sanityClient"
import { X, Upload, Trash2, Plus, Check } from "lucide-react"

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90)

const BRANDS = ["Toyota", "Honda", "Nissan", "Suzuki", "Mazda", "Mitsubishi", "Daihatsu", "Subaru", "Isuzu", "Lexus", "Hino", "Kia", "Hyundai", "Other"]

export default function AddProductForm({
  onClose,
  editing = null,
}: {
  onClose: () => void
  editing?: any
}) {
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [oldPrice, setOldPrice] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [condition, setCondition] = useState("Good")
  const [conditionScore, setConditionScore] = useState<number>(8)
  const [mileage, setMileage] = useState("")
  const [warranty, setWarranty] = useState<number | "">("")
  const [qualityChecked, setQualityChecked] = useState(true)
  const [japanImported, setJapanImported] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [newArrival, setNewArrival] = useState(false)
  const [inStock, setInStock] = useState(true)
  const [catId, setCatId] = useState("")
  const [subcatId, setSubcatId] = useState("")
  const [description, setDescription] = useState("")
  const [model, setModel] = useState("")

  /* SEO/Identity fields */
  const [brand, setBrand] = useState("")
  const [partNumber, setPartNumber] = useState("")
  const [engineCode, setEngineCode] = useState("")
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDesc, setSeoDesc] = useState("")

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  /* EDIT MODE: existing images (jo Sanity me hain) */
  const [existingImages, setExistingImages] = useState<{ url: string; _key: string }[]>([])
  /* EDIT MODE: jo existing images remove karni hain */
  const [removedImageKeys, setRemovedImageKeys] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!editing?._id

  const [categories, setCategories] = useState<any[]>([])
  const [subcats, setSubcats] = useState<any[]>([])

  const [showSubInput, setShowSubInput] = useState(false)
  const [newSubTitle, setNewSubTitle] = useState("")
  const [addingSub, setAddingSub] = useState(false)

  /* ============================================================
     🏷️ DISCOUNT SYSTEM
     - OldPrice daalo → % auto calculate
     - % daalo → OldPrice auto calculate
  ============================================================ */
  const priceNum = Number(String(price).replace(/[^0-9]/g, "")) || 0;
  const oldPriceNum = Number(String(oldPrice).replace(/[^0-9]/g, "")) || 0;

  const discountPercent =
    oldPriceNum > priceNum && priceNum > 0
      ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
      : 0;

  /* ✅ Discount % se Old Price banao (price ke upar) */
  const handleDiscountInput = (percent: number) => {
    if (!priceNum || percent <= 0 || percent >= 100) {
      setOldPrice("");
      return;
    }
    /* oldPrice = price / (1 - discount%) */
    const calculated = Math.round(priceNum / (1 - percent / 100));
    setOldPrice(calculated.toLocaleString("en-PK"));
  };

  /* ============================================================
     PREFILL (edit) — saari fields bharti hain
  ============================================================ */
  useEffect(() => {
    if (editing) {
      setTitle(editing.title || "")
      setPrice(editing.price || "")
      setOldPrice(editing.oldPrice || "")
      setDate(editing.publishedAt ? editing.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10))
      setCondition(editing.condition || "Good")
      setConditionScore(typeof editing.conditionScore === "number" ? editing.conditionScore : 8)
      setMileage(editing.mileage || "")
      setWarranty(typeof editing.warranty === "number" ? editing.warranty : "")
      setQualityChecked(editing.qualityChecked !== false)
      setJapanImported(!!editing.japanImported)
      setFeatured(!!editing.featured)
      setNewArrival(!!editing.newArrival)
      setInStock(editing.inStock !== false)
      setDescription(editing.description || "")
      setModel(editing.model || "")
      setBrand(editing.brand || "")
      setPartNumber(editing.partNumber || "")
      setEngineCode(editing.engineCode || "")
      setSeoTitle(editing.seoTitle || "")
      setSeoDesc(editing.seoDesc || "")

      /* Category/SubCategory — ref object ya id dono handle */
      setCatId(editing.catId || "")
      setSubcatId(editing.subcatId || "")

      /* Existing images — Sanity keys ke saath (remove karne ke liye) */
      const imgs = (editing.imagesRaw || []).map((im: any) => ({
        url: im.url || "",
        _key: im._key || "",
      })).filter((im: any) => im.url)
      setExistingImages(imgs)
      setImageFiles([])
      setImagePreviews([])
    } else {
      /* Reset for add mode */
      setTitle(""); setPrice(""); setOldPrice("")
      setDate(new Date().toISOString().slice(0, 10))
      setCondition("Good"); setConditionScore(8)
      setMileage(""); setWarranty("")
      setQualityChecked(true); setJapanImported(false)
      setFeatured(false); setNewArrival(false); setInStock(true)
      setDescription(""); setModel("")
      setBrand(""); setPartNumber(""); setEngineCode("")
      setSeoTitle(""); setSeoDesc("")
      setCatId(""); setSubcatId("")
      setExistingImages([]); setRemovedImageKeys([])
      setImageFiles([]); setImagePreviews([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  /* Categories + Subcategories */
  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setLoading(true)
      try {
        const [catsData, subsData] = await Promise.all([
          client.fetch<any[]>(
            `*[_type == "category"] | order(coalesce(order, 9999) asc, title asc){ _id, title }`
          ),
          client.fetch<any[]>(
            `*[_type == "subcategory"] | order(title asc){ _id, title, "parentId": parentCategory->_id }`
          ),
        ])
        if (cancelled) return
        setCategories(catsData || [])
        setSubcats(subsData || [])

        /* EDIT mode: category refs resolve karo */
        if (editing) {
          setCatId(editing.catId || "")
          setSubcatId(editing.subcatId || "")
        }
      } catch (error) {
        console.error("Fetch error:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const refreshSubcats = async (): Promise<any[]> => {
    const subsData = await client.fetch<any[]>(
      `*[_type == "subcategory"] | order(title asc){ _id, title, "parentId": parentCategory->_id }`
    )
    setSubcats(subsData || [])
    return subsData || []
  }

  const filteredSubcats = catId
    ? subcats.filter((sub) => sub.parentId === catId)
    : []

  const handleCatChange = (id: string) => {
    setCatId(id)
    setSubcatId("")
    setShowSubInput(false)
    setNewSubTitle("")
  }

  const handleConditionSelect = (c: string) => {
    setCondition(c)
    const auto: Record<string, number> = { Good: 8, Average: 6, Bad: 3 }
    setConditionScore(auto[c] ?? 5)
  }

  /* Live SEO suggestions */
  const suggestedSeoTitle = title
    ? `${title}${brand ? ` | ${brand}` : ""}${japanImported ? " Japan Imported" : ""} — AutoBrothers.pk`.substring(0, 70)
    : ""

  const suggestedSeoDesc = title
    ? `${title}${model ? ` (${model})` : ""} — ${japanImported ? "Japan imported, " : ""}${condition} condition${mileage ? `, ${mileage} km` : ""}. Quality checked with all-Pakistan delivery. Order on WhatsApp.`.substring(0, 160)
    : ""

  const handleAddSubcategory = async () => {
    const t = newSubTitle.trim()
    if (!t) return alert("Subcategory ka naam likho!")
    if (!catId) return alert("Pehle category select karo!")
    setAddingSub(true)
    try {
      const created: any = await adminCreate({
        _type: "subcategory",
        title: t,
        slug: { _type: "slug", current: slugify(t) },
        parentCategory: { _type: "reference", _ref: catId },
      })

      const updated = await refreshSubcats()
      const newId = created?._id || updated.find((s) => s.title === t)?._id
      if (newId) setSubcatId(newId)

      setNewSubTitle("")
      setShowSubInput(false)
      alert(`"${t}" subcategory add ho gayi! ✅`)
    } catch (e: any) {
      alert("Subcategory add nahi hui: " + (e?.message || "Unknown error"))
    } finally {
      setAddingSub(false)
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))
    if (newFiles.length === 0) return
    const totalNow = existingImages.length + imageFiles.length
    const remaining = 8 - totalNow
    const toAdd = newFiles.slice(0, Math.max(0, remaining))
    if (toAdd.length === 0) return alert("Max 8 images!")
    const newPreviews = toAdd.map((file) => URL.createObjectURL(file))
    setImageFiles((prev) => [...prev, ...toAdd])
    setImagePreviews((prev) => [...prev, ...newPreviews])
  }

  /* EDIT MODE: existing image remove — key note karo */
  const removeExistingImage = (key: string) => {
    setExistingImages((prev) => prev.filter((im) => im._key !== key))
    setRemovedImageKeys((prev) => [...prev, key])
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
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
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
    /* EDIT: existing images bhi count — kam az kam 1 honi chahiye */
    if (existingImages.length + imageFiles.length === 0) {
      alert("Kam az kam 1 image honi chahiye!")
      return
    }

    setSaving(true)

    try {
      /* NAYI images upload karo */
      const assetIds: string[] = []
      for (const file of imageFiles) {
        const assetId = await adminUploadImage(file)
        assetIds.push(assetId)
      }

      /* Common fields — create + update dono me jaayenge */
      const commonData: any = {
        title: title,
        price: price,
        oldPrice: oldPrice || undefined,
        brand: brand || undefined,
        partNumber: partNumber || undefined,
        engineCode: engineCode || undefined,
        seoTitle: seoTitle || undefined,
        seoDesc: seoDesc || undefined,
        condition: condition,
        conditionScore: conditionScore,
        mileage: mileage || undefined,
        warranty: warranty === "" ? undefined : Number(warranty),
        qualityChecked: qualityChecked,
        japanImported: japanImported,
        featured: featured,
        newArrival: newArrival,
        inStock: inStock,
        description: description || undefined,
        model: model || undefined,
        subcategory: { _type: "reference", _ref: subcatId },
      }

      if (isEditing) {
        /* ============================================================
           UPDATE MODE — slug/date UNCHANGED (SEO/backlinks safe)
        ============================================================ */
        const finalImages: any[] = []
        for (const im of existingImages.filter((e) => !removedImageKeys.includes(e._key))) {
          /* Existing image ka asset ref Sanity se fetch */
          const assetDoc = await client.fetch<{ _id: string } | null>(
            `*[_type == "sanity.imageAsset" && url == $url][0]{ _id }`,
            { url: im.url.split("?")[0] }
          )
          if (assetDoc?._id) {
            finalImages.push({
              _type: "image",
              _key: im._key,
              asset: { _type: "reference", _ref: assetDoc._id },
            })
          }
        }
        for (const id of assetIds) {
          finalImages.push({
            _type: "image",
            asset: { _type: "reference", _ref: id },
          })
        }

        const patch: any = {
          ...commonData,
          images: finalImages, /* poora array replace — removed + naye dono handle */
        }

        await adminUpdate(editing._id, patch)
        alert("✅ Product updated successfully!")
        onClose()
      } else {
        /* ============================================================
           CREATE MODE
        ============================================================ */
        const imagesArray = assetIds.map((id) => ({
          _type: "image",
          asset: { _type: "reference", _ref: id },
        }))

        await adminCreate({
          _type: "product",
          ...commonData,
          slug: {
            _type: "slug",
            current: slugify(title) + "-" + Date.now().toString(36).slice(-4),
          },
          images: imagesArray,
          publishedAt: date,
        })

        alert("Product successfully add ho gaya!")
        imagePreviews.forEach((url) => URL.revokeObjectURL(url))
        onClose()
      }
    } catch (error: any) {
      console.error(error)
      alert((isEditing ? "Update" : "Product add") + " nahi hua: " + (error?.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  const scoreColor =
    conditionScore >= 8 ? "bg-green-500" : conditionScore >= 6 ? "bg-amber-500" : "bg-red-500"

  /* Total image count (existing + new) */
  const totalImages = existingImages.filter((e) => !removedImageKeys.includes(e._key)).length + imageFiles.length

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
            <h2 className="text-xl font-bold">{isEditing ? "✏️ Edit Product" : "Add New Product"}</h2>
            <p className="text-xs text-gray-500 mt-1">
              {isEditing ? "URL locked — SEO safe" : "SEO-friendly listing banao"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white hover:bg-[#13293D] p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

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
                placeholder="e.g Toyota Corolla Axio 2ZR Engine 1.8L"
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
              />
              <p className="text-[10px] text-gray-600 mt-1">
                💡 Formula: [Brand] [Model] [Part] [Engine Code] [Year] — jyada behtar SEO
              </p>
            </div>

            {/* PART IDENTITY */}
            <div className="space-y-3 bg-[#13293D] border border-[#F5A623]/30 rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#F5A623] uppercase tracking-wider">
                🏷️ Part Identity (SEO ke liye zaruri)
              </p>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Brand *</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A1929] border border-[#1E3A52] rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623] cursor-pointer"
                >
                  <option value="">-- Select Brand --</option>
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  Part Number (OEM) <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="16800-0D010"
                  className="w-full px-4 py-3 bg-[#0A1929] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623]"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  🔧 Mechanics part number se search karte hain
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  Engine Code <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  value={engineCode}
                  onChange={(e) => setEngineCode(e.target.value)}
                  placeholder="2ZR-FE"
                  className="w-full px-4 py-3 bg-[#0A1929] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623]"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  ⚙️ e.g 2ZR-FE, K20Z, 1NZ-FE
                </p>
              </div>
            </div>

            {/* ✅ PRICE + DISCOUNT % SYSTEM */}
            <div className="space-y-3 bg-[#13293D] border border-[#F5A623]/30 rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#F5A623] uppercase tracking-wider">
                💰 Pricing + Discount
              </p>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Price (Rs) *</label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="25,000"
                  className="w-full px-4 py-3 bg-[#0A1929] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
                />
              </div>

              {/* ✅ DISCOUNT % — direct input */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  Discount % <span className="text-gray-600">(dalo — Old Price auto ban jayega)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={discountPercent || ""}
                    onChange={(e) => handleDiscountInput(Number(e.target.value))}
                    placeholder="e.g 20"
                    disabled={!priceNum}
                    className="flex-1 px-4 py-3 bg-[#0A1929] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] disabled:opacity-40"
                  />
                  <span className={`text-sm font-black px-3 py-2.5 rounded-xl min-w-[64px] text-center transition-colors ${
                    discountPercent > 0 ? "bg-rose-500 text-white" : "bg-[#1E3A52] text-gray-500"
                  }`}>
                    -{discountPercent}%
                  </span>
                </div>
                {!priceNum && (
                  <p className="text-[10px] text-gray-600 mt-1">Pehle Price daalo — phir % chalega</p>
                )}
              </div>

              {/* Old Price — % se auto ya manually */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  Old Price (Was Price) <span className="text-gray-600">(auto ya manual)</span>
                </label>
                <input
                  value={oldPrice}
                  onChange={(e) => setOldPrice(e.target.value)}
                  placeholder={priceNum ? String(Math.round(priceNum / 0.8).toLocaleString("en-PK")) : "30,000"}
                  className="w-full px-4 py-3 bg-[#0A1929] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623]"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  % daala to auto ban gaya — ya seedha old price bhi likh sakte ho
                </p>
              </div>

              {/* ✅ LIVE DISCOUNT PREVIEW — jaisa site pe dikhega */}
              {discountPercent > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-2xl font-black text-rose-500">-{discountPercent}%</span>
                  <div className="text-xs">
                    <p className="text-gray-300">
                      <span className="line-through text-gray-500">Rs {oldPriceNum.toLocaleString("en-PK")}</span>
                      {" → "}
                      <span className="font-bold text-[#F5A623]">Rs {priceNum.toLocaleString("en-PK")}</span>
                    </p>
                    <p className="text-gray-500">
                      Bachat: Rs {(oldPriceNum - priceNum).toLocaleString("en-PK")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Model + Mileage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Car Model</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="2015-2020"
                  className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Mileage (km)</label>
                <input
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="45,000"
                  className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
                />
              </div>
            </div>

            {/* Date — sirf ADD mode me (edit me date unchanged) */}
            {!isEditing && (
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Listing Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623] transition-colors"
                />
              </div>
            )}

            {/* CATEGORY DROPDOWN */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Category *</label>
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
                  <option key={cat._id} value={cat._id}>{cat.title}</option>
                ))}
              </select>
            </div>

            {/* SUBCATEGORY + INLINE ADD */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Sub Category *
                {catId && filteredSubcats.length > 0 && (
                  <span className="text-[#F5A623] ml-1">({filteredSubcats.length} found)</span>
                )}
              </label>
              <select
                value={subcatId}
                onChange={(e) => setSubcatId(e.target.value)}
                disabled={!catId}
                className={`w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm focus:outline-none transition-colors appearance-none ${
                  !catId ? "text-gray-600 cursor-not-allowed opacity-50" : "text-white focus:border-[#F5A623] cursor-pointer"
                }`}
                style={catId ? {
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239CA3AF' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                } : {}}
              >
                <option value="">
                  {!catId ? "Pehle category select karo..." : filteredSubcats.length === 0 ? "Is category mein koi subcategory nahi" : "-- Select Sub Category --"}
                </option>
                {filteredSubcats.map((sub: any) => (
                  <option key={sub._id} value={sub._id}>{sub.title}</option>
                ))}
              </select>

              {catId && !showSubInput && (
                <button
                  type="button"
                  onClick={() => setShowSubInput(true)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#F5A623]/40 text-xs font-bold text-[#F5A623] hover:bg-[#F5A623]/10 hover:border-[#F5A623] transition-all"
                >
                  <Plus size={14} />
                  {filteredSubcats.length === 0 ? "Nayi Subcategory Banao (zaruri hai)" : "+ Nayi Subcategory Banao"}
                </button>
              )}

              {catId && showSubInput && (
                <div className="mt-2 space-y-2 rounded-xl border border-[#F5A623]/40 bg-[#13293D] p-3">
                  <div className="flex gap-2">
                    <input
                      value={newSubTitle}
                      onChange={(e) => setNewSubTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSubcategory()}
                      autoFocus
                      placeholder="e.g Oil Filters"
                      className="flex-1 px-3 py-2.5 bg-[#0A1929] border border-[#1E3A52] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      disabled={addingSub || !newSubTitle.trim()}
                      className="shrink-0 px-4 rounded-lg bg-gradient-to-r from-[#F5A623] to-[#FFB94D] text-[#0A1929] text-xs font-bold disabled:opacity-50 flex items-center gap-1 transition-all"
                    >
                      {addingSub ? (
                        <div className="w-3.5 h-3.5 border-2 border-[#0A1929] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Check size={14} /> Save</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowSubInput(false); setNewSubTitle("") }}
                      disabled={addingSub}
                      className="shrink-0 px-3 rounded-lg border border-[#1E3A52] text-gray-400 hover:text-white transition-colors text-xs"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CONDITION + SCORE */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Condition + Score (out of 10)</label>
              <div className="grid grid-cols-3 gap-2">
                {["Good", "Average", "Bad"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleConditionSelect(c)}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      condition === c
                        ? c === "Good" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                        : c === "Average" ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/50"
                        : "bg-[#13293D] text-gray-500 border border-[#1E3A52] hover:border-[#F5A623]/30"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={0} max={10} step={1}
                  value={conditionScore}
                  onChange={(e) => setConditionScore(Number(e.target.value))}
                  className="flex-1 accent-[#F5A623] cursor-pointer"
                />
                <span className={`${scoreColor} text-white text-sm font-black px-2.5 py-1 rounded-lg min-w-[52px] text-center`}>
                  {conditionScore}/10
                </span>
              </div>
            </div>

            {/* WARRANTY */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Warranty (days) <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="number" min={0}
                value={warranty}
                onChange={(e) => setWarranty(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="30"
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>

            {/* IMAGES — existing + new */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Product Images * <span className="text-gray-600">({totalImages}/8)</span>
              </label>

              {/* EXISTING images (edit mode) */}
              {existingImages.filter((e) => !removedImageKeys.includes(e._key)).length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {existingImages.filter((e) => !removedImageKeys.includes(e._key)).map((im, i) => (
                    <div key={im._key} className="relative group aspect-square rounded-lg overflow-hidden border border-green-500/30 bg-[#0D1F30]">
                      <img src={im.url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-green-500/80 text-white text-[8px] font-bold px-1 rounded">SAVED</span>
                      {/* ✅ Discount badge — pehli existing image pe */}
                      {i === 0 && discountPercent > 0 && (
                        <span className="absolute bottom-1 left-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                          -{discountPercent}%
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(im._key)}
                        className="absolute top-1 right-1 bg-rose-500/90 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 w-full h-24 bg-[#13293D] border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  dragActive ? "border-[#F5A623] bg-[#F5A623]/5" : "border-[#1E3A52] hover:border-[#F5A623]/50"
                }`}
              >
                <Upload size={18} className={dragActive ? "text-[#F5A623]" : "text-gray-500"} />
                <p className="text-xs text-gray-500 text-center">
                  {totalImages > 0 ? "Aur images add karo" : "Click or drag images here"}
                  <span className="text-[10px] text-gray-600"> (max 8)</span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file" accept="image/*" multiple
                  className="hidden"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = "" }}
                />
              </div>

              {/* New previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-[#1E3A52] bg-[#0D1F30]">
                      <img src={src} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-[#F5A623] text-[#0A1929] text-[8px] font-bold px-1 rounded">NEW</span>
                      {/* ✅ Discount badge — pehli nayi image pe (agar koi existing nahi) */}
                      {i === 0 && existingImages.length === 0 && discountPercent > 0 && (
                        <span className="absolute bottom-1 left-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                          -{discountPercent}%
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                        className="absolute top-1 right-1 bg-rose-500/90 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={"✍️ Aise likho:\n\n• Kya hai + kis car ke liye\n• Condition details (testing, mileage)\n• Kya milega (warranty)\n• Delivery (all Pakistan)"}
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors resize-none"
              />
            </div>

            {/* SEO SECTION */}
            <div className="space-y-3 bg-[#13293D] border border-[#F5A623]/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#F5A623] uppercase tracking-wider">
                  🔍 SEO (Google pe kya dikhe)
                </p>
                {title && (
                  <button
                    type="button"
                    onClick={() => { setSeoTitle(suggestedSeoTitle); setSeoDesc(suggestedSeoDesc) }}
                    className="text-[10px] font-bold text-blue-400 hover:underline"
                  >
                    ✨ Auto-generate
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">SEO Title</label>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  maxLength={70}
                  placeholder={suggestedSeoTitle || "Toyota 2ZR Engine for Sale in Pakistan | AutoBrothers"}
                  className="w-full px-4 py-3 bg-[#0A1929] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623]"
                />
                <p className={`text-[10px] text-right mt-0.5 ${seoTitle.length > 60 ? "text-red-400" : "text-gray-600"}`}>
                  {seoTitle.length}/60
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">SEO Description</label>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  rows={3}
                  maxLength={170}
                  placeholder={suggestedSeoDesc || "Japan imported Toyota 2ZR engine, tested, 45,000 km. Warranty ke saath all-Pakistan delivery."}
                  className="w-full px-4 py-3 bg-[#0A1929] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] resize-none"
                />
                <p className={`text-[10px] text-right mt-0.5 ${seoDesc.length > 160 ? "text-red-400" : "text-gray-600"}`}>
                  {seoDesc.length}/160
                </p>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 bg-[#13293D] border border-[#1E3A52] rounded-xl p-4">
              {/* Quality Checked */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Quality Checked</span>
                  {qualityChecked && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">✅ TESTED</span>}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={qualityChecked} onChange={(e) => setQualityChecked(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#1E3A52] rounded-full peer peer-checked:bg-blue-500 transition-colors relative">
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${qualityChecked ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </label>
              </div>
              <div className="h-px bg-[#1E3A52]" />

              {/* Japan Imported */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Japan Imported</span>
                  {japanImported && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">🇯🇵 JAPAN</span>}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={japanImported} onChange={(e) => setJapanImported(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#1E3A52] rounded-full peer peer-checked:bg-purple-500 transition-colors relative">
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${japanImported ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </label>
              </div>
              <div className="h-px bg-[#1E3A52]" />

              {/* In Stock */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">In Stock</span>
                  {inStock && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">AVAILABLE</span>}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#1E3A52] rounded-full peer peer-checked:bg-emerald-500 transition-colors relative">
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${inStock ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </label>
              </div>
              <div className="h-px bg-[#1E3A52]" />

              {/* Featured */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Featured Product</span>
                  {featured && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F5A623]/20 text-[#F5A623]">FEATURED</span>}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#1E3A52] rounded-full peer peer-checked:bg-[#F5A623] transition-colors relative">
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${featured ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </label>
              </div>
              <div className="h-px bg-[#1E3A52]" />

              {/* New Arrival */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">New Arrival</span>
                  {newArrival && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">NEW</span>}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={newArrival} onChange={(e) => setNewArrival(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#1E3A52] rounded-full peer peer-checked:bg-blue-500 transition-colors relative">
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${newArrival ? "translate-x-5" : "translate-x-0"}`} />
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
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} /> {isEditing ? "Update Product" : "Save Product"}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}