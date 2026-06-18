import { useState, useEffect, useRef } from "react"
import Head from "next/head"
import Link from "next/link"
import { PlusCircle, LayoutGrid, Layers, Package, X, Upload, Loader2, Home, Trash2, Pencil } from "lucide-react"
import { compressImage, compressMultipleImages } from "../../lib/imageCompress"

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [cats, setCats] = useState<any[]>([])
  const [subcats, setSubcats] = useState<any[]>([])
  const [prods, setProds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

  const [showForm, setShowForm] = useState("")
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)

  // Category state
  const [catTitle, setCatTitle] = useState("")
  const [catTag, setCatTag] = useState("none")
  const [catImage, setCatImage] = useState<File | null>(null)

  // Sub Category state
  const [subCatTitle, setSubCatTitle] = useState("")
  const [subCatParent, setSubCatParent] = useState("")
  const [subCatImage, setSubCatImage] = useState<File | null>(null)

  // Product state - MULTI-IMAGE
  const [prodTitle, setProdTitle] = useState("")
  const [prodPrice, setProdPrice] = useState("")
  const [prodCondition, setProdCondition] = useState("Good")
  const [prodSubCat, setProdSubCat] = useState("")
  const [prodFeatured, setProdFeatured] = useState(false)
  const [prodNewArrival, setProdNewArrival] = useState(false)
  const [prodDescription, setProdDescription] = useState("")
  const [prodModel, setProdModel] = useState("")
  const [prodInStock, setProdInStock] = useState(true)
  const [prodImages, setProdImages] = useState<File[]>([])
  const [prodImagePreviews, setProdImagePreviews] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ═══════ DATA FETCHING (via API route - NO CORS) ═══════
  const fetchData = async () => {
    setErrorMsg("")
    setLoading(true)
    try {
      const [catRes, subRes, prodRes] = await Promise.all([
        fetch("/api/get-data?type=categories"),
        fetch("/api/get-data?type=subcategories"),
        fetch("/api/get-data?type=products"),
      ])

      const [catJson, subJson, prodJson] = await Promise.all([
        catRes.json(),
        subRes.json(),
        prodRes.json(),
      ])

      if (!catJson.success) throw new Error(catJson.error || "Categories fetch failed")
      if (!subJson.success) throw new Error(subJson.error || "Subcategories fetch failed")
      if (!prodJson.success) throw new Error(prodJson.error || "Products fetch failed")

      setCats(catJson.data || [])
      setSubcats(subJson.data || [])
      setProds(prodJson.data || [])
    } catch (err: any) {
      console.error("Fetch error:", err)
      setErrorMsg(err.message || "Unknown error")
      setCats([])
      setSubcats([])
      setProds([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ═══════ MULTI-IMAGE HANDLERS (with compression) ═══════
  const handleProdFiles = async (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))
    if (newFiles.length === 0) return

    setCompressing(true)
    try {
      const compressed = await compressMultipleImages(newFiles, {
        targetSizeKB: 400,
        maxDimension: 1600,
      })
      const remaining = 8 - prodImages.length
      const toAdd = compressed.slice(0, remaining)
      const newPreviews = toAdd.map((file) => URL.createObjectURL(file))
      setProdImages((prev) => [...prev, ...toAdd])
      setProdImagePreviews((prev) => [...prev, ...newPreviews])
    } catch (err) {
      console.error("Compression failed:", err)
      alert("Image compression failed. Please try smaller images.")
    } finally {
      setCompressing(false)
    }
  }

  const removeProdImage = (index: number) => {
    setProdImages((prev) => prev.filter((_, i) => i !== index))
    setProdImagePreviews((prev) => {
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
    handleProdFiles(e.dataTransfer.files)
  }

  const resetForms = () => {
    setCatTitle("")
    setCatTag("none")
    setCatImage(null)
    setSubCatTitle("")
    setSubCatParent("")
    setSubCatImage(null)
    setProdTitle("")
    setProdPrice("")
    setProdCondition("Good")
    setProdSubCat("")
    setProdFeatured(false)
    setProdNewArrival(false)
    setProdDescription("")
    setProdModel("")
    setProdInStock(true)
    prodImagePreviews.forEach((url) => URL.revokeObjectURL(url))
    setProdImages([])
    setProdImagePreviews([])
    setEditingId(null)
  }

  // ═══════ SINGLE IMAGE HANDLER (Category/Subcategory with compression) ═══════
  const handleSingleImage = async (file: File, setter: (f: File | null) => void) => {
    setCompressing(true)
    try {
      const compressed = await compressImage(file, {
        targetSizeKB: 400,
        maxDimension: 1200,
      })
      setter(compressed)
    } catch (err) {
      console.error(err)
      setter(file)
    } finally {
      setCompressing(false)
    }
  }

  // ═══════ DELETE HANDLER ═══════
  const handleDelete = async (id: string, type: string) => {
    if (!confirm("Are you sure? All linked items will also be deleted.")) return
    try {
      const res = await fetch("/api/admin/delete-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type }),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert("Failed to delete: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      alert("Error deleting")
    }
  }

  // ═══════ EDIT HANDLERS ═══════
  const handleEditCategory = (cat: any) => {
    setEditingId(cat._id)
    setCatTitle(cat.title)
    setCatTag(cat.tag || "none")
    setCatImage(null)
    setShowForm("category")
  }

  const handleEditSubCategory = (sub: any) => {
    setEditingId(sub._id)
    setSubCatTitle(sub.title)
    setSubCatParent(sub.parentId || "")
    setSubCatImage(null)
    setShowForm("subcategory")
  }

  const handleEditProduct = (p: any) => {
    setEditingId(p._id)
    setProdTitle(p.title)
    setProdPrice(p.price)
    setProdCondition(p.condition || "Good")
    setProdSubCat(p.subCatId || "")
    setProdFeatured(p.featured)
    setProdNewArrival(p.newArrival)
    setProdDescription(p.description || "")
    setProdModel(p.model || "")
    setProdImages([])
    setProdImagePreviews([])
    setShowForm("product")
  }

  // ═══════ SAVE HANDLERS ═══════
  const handleSaveCategory = async () => {
    if (!catTitle) return alert("Title is required!")
    setSaving(true)
    try {
      let imageData = null
      let fileName = null
      if (catImage) {
        imageData = await convertToBase64(catImage)
        fileName = catImage.name
      }

      const endpoint = editingId ? "/api/admin/update-data" : "/api/admin/add-data"
      const payload = editingId
        ? { id: editingId, type: "category", title: catTitle, tag: catTag, imageData, fileName }
        : { type: "category", title: catTitle, slug: catTitle.toLowerCase().replace(/\s+/g, "-"), tag: catTag, imageData, fileName }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed")

      alert(editingId ? "Category Updated!" : "Category Added!")
      resetForms()
      setShowForm("")
      fetchData()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSubCategory = async () => {
    if (!subCatTitle || !subCatParent) return alert("Title and Parent are required!")
    setSaving(true)
    try {
      let imageData = null
      let fileName = null
      if (subCatImage) {
        imageData = await convertToBase64(subCatImage)
        fileName = subCatImage.name
      }

      const endpoint = editingId ? "/api/admin/update-data" : "/api/admin/add-data"
      const payload = editingId
        ? { id: editingId, type: "subcategory", title: subCatTitle, imageData, fileName }
        : { type: "subcategory", title: subCatTitle, slug: subCatTitle.toLowerCase().replace(/\s+/g, "-"), parentId: subCatParent, imageData, fileName }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed")

      alert(editingId ? "Sub Category Updated!" : "Sub Category Added!")
      resetForms()
      setShowForm("")
      fetchData()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProduct = async () => {
    if (!prodTitle || !prodSubCat) return alert("Title and Sub Category are required!")
    if (!editingId && prodImages.length === 0) return alert("Please add at least 1 product image!")
    setSaving(true)
    try {
      const imagesData = []
      for (const file of prodImages) {
        const data = await convertToBase64(file)
        imagesData.push({ data, fileName: file.name })
      }

      const endpoint = editingId ? "/api/admin/update-data" : "/api/admin/add-data"
      const payload = editingId
        ? {
            id: editingId,
            type: "product",
            title: prodTitle,
            price: prodPrice,
            condition: prodCondition,
            featured: prodFeatured,
            newArrival: prodNewArrival,
            inStock: prodInStock,
            description: prodDescription,
            model: prodModel,
            imagesData: imagesData.length > 0 ? imagesData : undefined,
          }
        : {
            type: "product",
            title: prodTitle,
            slug: prodTitle.toLowerCase().replace(/\s+/g, "-"),
            parentId: prodSubCat,
            price: prodPrice,
            condition: prodCondition,
            featured: prodFeatured,
            newArrival: prodNewArrival,
            inStock: prodInStock,
            description: prodDescription,
            model: prodModel,
            imagesData: imagesData,
          }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed")

      alert(editingId ? "Product Updated!" : "Product Added!")
      resetForms()
      setShowForm("")
      fetchData()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Head>
        <title>AutoBrothers | Admin Panel</title>
      </Head>
      <div className="min-h-screen bg-[#0A1929] text-white flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="md:w-64 bg-[#13293D] border-r border-[#1E3A52] md:min-h-screen flex md:flex-col flex-row overflow-x-auto">
          <div className="hidden md:flex items-center gap-2 p-6 border-b border-[#1E3A52]">
            <span className="font-extrabold text-lg">
              Auto<span className="text-[#F5A623]">Admin</span>
            </span>
          </div>
          <nav className="flex md:flex-col flex-row w-full md:pt-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === "dashboard" ? "text-[#F5A623] bg-[#0A1929] border-r-4 border-[#F5A623]" : "text-gray-400 hover:text-white"}`}
            >
              <LayoutGrid size={18} /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === "categories" ? "text-[#F5A623] bg-[#0A1929] border-r-4 border-[#F5A623]" : "text-gray-400 hover:text-white"}`}
            >
              <Layers size={18} /> Categories
            </button>
            <button
              onClick={() => setActiveTab("subcategories")}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === "subcategories" ? "text-[#F5A623] bg-[#0A1929] border-r-4 border-[#F5A623]" : "text-gray-400 hover:text-white"}`}
            >
              <Package size={18} /> Sub Categories
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === "products" ? "text-[#F5A623] bg-[#0A1929] border-r-4 border-[#F5A623]" : "text-gray-400 hover:text-white"}`}
            >
              <PlusCircle size={18} /> Products
            </button>
            <Link href="/" className="mt-auto flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-500 hover:text-white">
              <Home size={18} /> Back to Website
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-xl mb-6">
              <strong>Error:</strong> {errorMsg}
              <button onClick={fetchData} className="ml-4 underline hover:text-red-200">Retry</button>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#13293D] border border-[#1E3A52] p-5 rounded-xl">
                  <p className="text-gray-400 text-xs">Categories</p>
                  <p className="text-2xl font-bold text-[#F5A623] mt-1">{cats.length}</p>
                </div>
                <div className="bg-[#13293D] border border-[#1E3A52] p-5 rounded-xl">
                  <p className="text-gray-400 text-xs">Sub Categories</p>
                  <p className="text-2xl font-bold text-[#F5A623] mt-1">{subcats.length}</p>
                </div>
                <div className="bg-[#13293D] border border-[#1E3A52] p-5 rounded-xl">
                  <p className="text-gray-400 text-xs">Products</p>
                  <p className="text-2xl font-bold text-[#F5A623] mt-1">{prods.length}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Main Categories</h1>
                <button onClick={() => { resetForms(); setShowForm("category"); }} className="bg-[#F5A623] text-[#0A1929] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-[#D4911E]">
                  <PlusCircle size={16} /> Add Category
                </button>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500"><Loader2 size={16} className="animate-spin" /> Loading...</div>
              ) : cats.length === 0 ? (
                <div className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-10 text-center text-gray-500">No categories found.</div>
              ) : (
                <div className="space-y-3">
                  {cats.map((cat) => (
                    <div key={cat._id} className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-4 flex items-center gap-4">
                      {cat.image ? <img src={cat.image} alt="" className="w-14 h-14 rounded-lg object-cover" /> : <div className="w-14 h-14 bg-[#0D1F30] rounded-lg flex items-center justify-center text-xl">Box</div>}
                      <div className="flex-1">
                        <h3 className="font-bold">{cat.title}</h3>
                        {cat.tag && cat.tag !== "none" && <p className="text-xs text-gray-500">Tag: {cat.tag}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditCategory(cat)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(cat._id, "category")} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "subcategories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Sub Categories</h1>
                <button onClick={() => { resetForms(); setShowForm("subcategory"); }} className="bg-[#F5A623] text-[#0A1929] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-[#D4911E]">
                  <PlusCircle size={16} /> Add Sub Category
                </button>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500"><Loader2 size={16} className="animate-spin" /> Loading...</div>
              ) : subcats.length === 0 ? (
                <div className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-10 text-center text-gray-500">No sub categories found.</div>
              ) : (
                <div className="space-y-3">
                  {subcats.map((sub) => (
                    <div key={sub._id} className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-4 flex items-center gap-4">
                      {sub.image ? <img src={sub.image} alt="" className="w-14 h-14 rounded-lg object-cover" /> : <div className="w-14 h-14 bg-[#0D1F30] rounded-lg flex items-center justify-center text-xl">Box</div>}
                      <div className="flex-1">
                        <h3 className="font-bold">{sub.title}</h3>
                        <p className="text-xs text-gray-500">Parent: {sub.parentTitle || "None"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSubCategory(sub)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(sub._id, "subcategory")} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Products</h1>
                <button onClick={() => { resetForms(); setShowForm("product"); }} className="bg-[#F5A623] text-[#0A1929] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-[#D4911E]">
                  <PlusCircle size={16} /> Add Product
                </button>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500"><Loader2 size={16} className="animate-spin" /> Loading...</div>
              ) : prods.length === 0 ? (
                <div className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-10 text-center text-gray-500">No products found.</div>
              ) : (
                <div className="space-y-3">
                  {prods.map((p) => (
                    <div key={p._id} className="bg-[#13293D] border border-[#1E3A52] rounded-xl p-4 flex items-center gap-4">
                      {p.image ? <img src={p.image} alt="" className="w-14 h-14 rounded-lg object-cover" /> : <div className="w-14 h-14 bg-[#0D1F30] rounded-lg flex items-center justify-center text-xl">Car</div>}
                      <div className="flex-1">
                        <h3 className="font-bold">{p.title}</h3>
                        <p className="text-xs text-gray-500">Rs {p.price} - {p.subCatTitle || "No category"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditProduct(p)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(p._id, "product")} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ CATEGORY MODAL ═══════ */}
      {showForm === "category" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => { setShowForm(""); resetForms(); }}>
          <div className="w-full max-w-md bg-[#0A1929] border border-[#1E3A52] rounded-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowForm(""); resetForms(); }} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
            <h2 className="text-xl font-bold mb-6">{editingId ? "Edit Category" : "Add New Category"}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Category Name *</label>
                <input value={catTitle} onChange={(e) => setCatTitle(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white focus:outline-none focus:border-[#F5A623]" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tag</label>
                <select value={catTag} onChange={(e) => setCatTag(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-gray-300 focus:outline-none focus:border-[#F5A623]">
                  <option value="none">None</option>
                  <option value="featured">Featured</option>
                  <option value="new_arrival">New Arrival</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Image (auto-compressed to 400KB)</label>
                <label className="flex items-center justify-center gap-2 w-full h-24 bg-[#13293D] border-2 border-dashed border-[#1E3A52] rounded-xl cursor-pointer hover:border-[#F5A623] text-gray-500 text-sm">
                  {compressing ? <><Loader2 size={16} className="animate-spin" /> Compressing...</> : <><Upload size={16} /> {catImage ? catImage.name : "Upload"}</>}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null
                      if (f) handleSingleImage(f, setCatImage)
                    }}
                  />
                </label>
              </div>
              <button onClick={handleSaveCategory} disabled={saving || compressing} className="w-full bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? "Saving..." : editingId ? "Update Category" : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SUBCATEGORY MODAL ═══════ */}
      {showForm === "subcategory" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => { setShowForm(""); resetForms(); }}>
          <div className="w-full max-w-md bg-[#0A1929] border border-[#1E3A52] rounded-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowForm(""); resetForms(); }} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
            <h2 className="text-xl font-bold mb-6">{editingId ? "Edit Sub Category" : "Add New Sub Category"}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Sub Category Name *</label>
                <input value={subCatTitle} onChange={(e) => setSubCatTitle(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white focus:outline-none focus:border-[#F5A623]" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Parent Category *</label>
                <select value={subCatParent} onChange={(e) => setSubCatParent(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-gray-300 focus:outline-none focus:border-[#F5A623]">
                  <option value="">Select Category...</option>
                  {cats.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Image (auto-compressed to 400KB)</label>
                <label className="flex items-center justify-center gap-2 w-full h-24 bg-[#13293D] border-2 border-dashed border-[#1E3A52] rounded-xl cursor-pointer hover:border-[#F5A623] text-gray-500 text-sm">
                  {compressing ? <><Loader2 size={16} className="animate-spin" /> Compressing...</> : <><Upload size={16} /> {subCatImage ? subCatImage.name : "Upload"}</>}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null
                      if (f) handleSingleImage(f, setSubCatImage)
                    }}
                  />
                </label>
              </div>
              <button onClick={handleSaveSubCategory} disabled={saving || compressing} className="w-full bg-[#F5A623] hover:bg-[#D4911E] text-[#0A1929] font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? "Saving..." : editingId ? "Update Sub Category" : "Save Sub Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ PRODUCT MODAL (MULTI-IMAGE) ═══════ */}
      {showForm === "product" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => { setShowForm(""); resetForms(); }}>
          <div className="w-full max-w-lg bg-[#0A1929] border border-[#1E3A52] rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowForm(""); resetForms(); }} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10"><X size={18} /></button>
            <h2 className="text-xl font-bold mb-6">{editingId ? "Edit Product" : "Add New Product"}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Product Title *</label>
                <input value={prodTitle} onChange={(e) => setProdTitle(e.target.value)} placeholder="e.g Toyota Corolla Engine" className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Price</label>
                  <input value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} placeholder="Rs 25,000" className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Condition</label>
                  <select value={prodCondition} onChange={(e) => setProdCondition(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-gray-300 focus:outline-none focus:border-[#F5A623]">
                    <option>Good</option>
                    <option>Average</option>
                    <option>Bad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Sub Category *</label>
                <select value={prodSubCat} onChange={(e) => setProdSubCat(e.target.value)} className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-gray-300 focus:outline-none focus:border-[#F5A623]">
                  <option value="">Select Sub Category...</option>
                  {subcats.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Car Model</label>
                <input value={prodModel} onChange={(e) => setProdModel(e.target.value)} placeholder="e.g Corolla 2020, Civic Oriel" className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623]" />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Product Description</label>
                <textarea value={prodDescription} onChange={(e) => setProdDescription(e.target.value)} rows={3} placeholder="Write details..." className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] resize-none" />
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#13293D] border border-[#1E3A52] rounded-xl p-3">
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="text-gray-300">In Stock</span>
                  <input type="checkbox" checked={prodInStock} onChange={(e) => setProdInStock(e.target.checked)} className="accent-[#F5A623] w-4 h-4" />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="text-gray-300">Featured</span>
                  <input type="checkbox" checked={prodFeatured} onChange={(e) => setProdFeatured(e.target.checked)} className="accent-[#F5A623] w-4 h-4" />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="text-gray-300">New</span>
                  <input type="checkbox" checked={prodNewArrival} onChange={(e) => setProdNewArrival(e.target.checked)} className="accent-[#F5A623] w-4 h-4" />
                </label>
              </div>

              {/* MULTI-IMAGE UPLOAD */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  Product Images * <span className="text-gray-600">({prodImages.length}/8) - auto-compressed to 400KB</span>
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !compressing && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 w-full h-32 bg-[#13293D] border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    compressing ? "border-[#F5A623] bg-[#F5A623]/5 cursor-wait" : dragActive ? "border-[#F5A623] bg-[#F5A623]/5" : "border-[#1E3A52] hover:border-[#F5A623]/50"
                  }`}
                >
                  {compressing ? (
                    <>
                      <Loader2 size={20} className="text-[#F5A623] animate-spin" />
                      <p className="text-xs text-[#F5A623]">Compressing images...</p>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className={dragActive ? "text-[#F5A623]" : "text-gray-500"} />
                      <p className="text-xs text-gray-500 text-center">
                        {dragActive ? "Drop images here" : "Click or drag images here"}
                        <br />
                        <span className="text-[10px] text-gray-600">PNG, JPG, WEBP (max 8) - auto-compressed</span>
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleProdFiles(e.target.files)
                      e.target.value = ""
                    }}
                  />
                </div>

                {prodImagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {prodImagePreviews.map((src, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-[#1E3A52] bg-[#0D1F30]">
                        <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-[#0A1929]/80 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{i + 1}</div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeProdImage(i) }}
                          className="absolute top-1 right-1 bg-rose-500/90 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={10} />
                        </button>
                        {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-[#F5A623] text-[#0A1929] text-[8px] font-bold py-0.5 text-center">MAIN</div>}
                      </div>
                    ))}
                    {prodImages.length < 8 && !compressing && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-[#1E3A52] hover:border-[#F5A623]/50 flex items-center justify-center text-gray-600 hover:text-[#F5A623] transition-all"
                      >
                        <PlusCircle size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button onClick={handleSaveProduct} disabled={saving || compressing} className="w-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] hover:from-[#FFB94D] hover:to-[#F5A623] text-[#0A1929] font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0A1929] border-t-transparent rounded-full animate-spin"></div>
                    Uploading {prodImages.length} images...
                  </>
                ) : (
                  <><PlusCircle size={16} /> {editingId ? "Update Product" : "Save Product"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}