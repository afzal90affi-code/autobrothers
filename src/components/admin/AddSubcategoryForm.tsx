"use client";
import { useState, useEffect } from "react"
import { adminCreate } from "../../lib/adminApi"
import { X } from "lucide-react"

export default function AddSubcategoryForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("")
  const [catId, setCatId] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/get-data?type=categories")
      .then(r => r.json())
      .then(res => setCategories(res?.success ? res.data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!title || !catId) {
      alert("Title aur Category dono zaruri hain!")
      return
    }
    setSaving(true)
    try {
      await adminCreate({
        _type: "subcategory",
        title,
        parentCatId: catId,
        // ⚠️ Agar Sanity schema me field ka naam "parentId" hai
        // toh upar wali line hata ke ye use karo:
        // parentId: catId,
      })
      alert("Subcategory add ho gayi!")
      onClose()
    } catch (err: any) {
      alert("Error: " + (err?.message || "Unknown"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0A1929] border-l border-[#1E3A52] h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Add Subcategory</h2>
            <p className="text-xs text-gray-500 mt-1">Select a parent category</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white hover:bg-[#13293D] p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Subcategory Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g Engine Parts"
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Parent Category *</label>
              <select
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white focus:outline-none focus:border-[#F5A623] transition-colors cursor-pointer"
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>{cat.title}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-[10px] text-rose-400 mt-1.5">Koi category nahi mili. Pehle category banao.</p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#F5A623] to-[#FFB94D] text-[#0A1929] font-bold py-3 rounded-xl mt-2 disabled:opacity-50 transition-all"
            >
              {saving ? "Saving..." : "Save Subcategory"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}