"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { client } from "../../../lib/sanityClient";
import { adminCreate, adminDelete, adminUpdate, adminUploadImage } from "../../../lib/adminApi";
import { Trash2, Plus, RefreshCw, ImagePlus, Pencil, Check, X } from "lucide-react";

/* ============================================================
   Types
   ============================================================ */
type Cat = { _id: string; title: string };
type SubCat = { _id: string; title: string; parentId?: string; parentTitle?: string; img?: string };

const inputCls =
  "w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);

/* ============================================================
   Image picker (categories page wala same)
   ============================================================ */
function ImagePicker({
  preview,
  onSelect,
  onRemove,
  label,
}: {
  preview: string;
  onSelect: (f: File) => void;
  onRemove: () => void;
  label: string;
}) {
  if (preview) {
    return (
      <div className="relative">
        <img src={preview} alt="Preview" className="h-14 w-20 rounded-lg object-cover ring-1 ring-[#1E3A52]" />
        <button type="button" onClick={onRemove}
          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">✕</button>
      </div>
    );
  }
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#1E3A52] px-3 py-2 text-xs text-gray-500 transition hover:border-[#F5A623]/50 hover:text-[#F5A623]">
      <ImagePlus size={13} /> {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

/* ============================================================
   SubCategory Manager — Add + Edit + Delete + Image + Parent Change
   ============================================================ */
function SubCategoryManager({
  label,
  subType,
  parentType,
  parentField,
}: {
  label: string;
  subType: string;
  parentType: string;
  parentField: string;
}) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<SubCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  /* ---------- ADD states ---------- */
  const [newTitle, setNewTitle] = useState("");
  const [newParent, setNewParent] = useState("");
  const [newImg, setNewImg] = useState<File | null>(null);
  const [newImgPreview, setNewImgPreview] = useState("");

  /* ---------- FILTER state ---------- */
  const [filterParent, setFilterParent] = useState("");

  /* ---------- EDIT states ---------- */
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editParent, setEditParent] = useState("");
  const [editImg, setEditImg] = useState<File | null>(null);
  const [editImgPreview, setEditImgPreview] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const c = await client.fetch<Cat[]>(
        `*[_type == "${parentType}"] | order(title asc){ _id, title }`
      ).catch(() => []);
      const s = await client.fetch<SubCat[]>(
        `*[_type == "${subType}"] | order(title asc){ _id, title, "parentId": ${parentField}->_id, "parentTitle": ${parentField}->title, "img": image.asset->url }`
      ).catch(() => []);
      setCats(c ?? []);
      setSubs(s ?? []);
    } finally {
      setLoading(false);
    }
  }, [subType, parentType, parentField]);

  useEffect(() => { refresh(); }, [refresh]);

  /* ---------- ADD SUBCATEGORY ---------- */
  const addSub = async () => {
    const title = newTitle.trim();
    if (!title) return alert("Subcategory ka naam likho!");
    if (!newParent) return alert("Parent category select karo!");
    setBusy(true);
    try {
      let imageRef: any = undefined;
      if (newImg) {
        const assetId = await adminUploadImage(newImg);
        imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      }
      await adminCreate({
        _type: subType,
        title,
        slug: { _type: "slug", current: slugify(title) },
        image: imageRef,
        [parentField]: { _type: "reference", _ref: newParent },
      });
      setNewTitle("");
      setNewParent("");
      setNewImg(null);
      setNewImgPreview("");
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
    setBusy(false);
  };

  /* ---------- EDIT ---------- */
  const startEdit = (s: SubCat) => {
    setEditId(s._id);
    setEditTitle(s.title);
    setEditParent(s.parentId || "");
    setEditImg(null);
    setEditImgPreview("");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditParent("");
    setEditImg(null);
    setEditImgPreview("");
  };

  const saveEdit = async () => {
    if (!editId) return;
    const title = editTitle.trim();
    if (!title) return alert("Title required!");
    if (!editParent) return alert("Parent category select karo!");
    setBusy(true);
    try {
      const patch: any = { title, [parentField]: { _type: "reference", _ref: editParent } };
      if (editImg) {
        const assetId = await adminUploadImage(editImg);
        patch.image = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      }
      await adminUpdate(editId, patch);
      cancelEdit();
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    }
    setBusy(false);
  };

  /* ---------- DELETE ---------- */
  const removeSub = async (s: SubCat) => {
    if (!confirm(`"${s.title}" delete karein? (Products safe rahenge)`)) return;
    setBusy(true);
    try {
      await adminDelete(s._id);
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
    setBusy(false);
  };

  /* ---------- Grouping (parent category ke hisaab se) ---------- */
  const filteredSubs = filterParent ? subs.filter((s) => s.parentId === filterParent) : subs;

  const grouped = cats
    .map((c) => ({ cat: c, items: filteredSubs.filter((s) => s.parentId === c._id) }))
    .filter((g) => g.items.length > 0);

  const orphans = filteredSubs.filter(
    (s) => !s.parentId || !cats.some((c) => c._id === s.parentId)
  );

  return (
    <div className="space-y-4">
      {/* ---------- ADD FORM ---------- */}
      <div className="space-y-2.5 rounded-xl border border-[#1E3A52] bg-[#0D1F30]/60 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Nayi {label} Subcategory
        </p>
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSub()}
            placeholder="Subcategory ka naam... (e.g Oil Filters)"
            className={inputCls}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={newParent}
            onChange={(e) => setNewParent(e.target.value)}
            className={`${inputCls} cursor-pointer appearance-none`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239CA3AF' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center",
            }}
          >
            <option value="">-- Parent Category select karo --</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
          <button onClick={addSub} disabled={busy || !newTitle.trim() || !newParent}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FFB94D] px-5 text-sm font-bold text-[#0A1929] disabled:opacity-50 flex items-center gap-1.5">
            <Plus size={15} /> Add
          </button>
        </div>
        <ImagePicker
          preview={newImgPreview}
          onSelect={(f) => { setNewImg(f); setNewImgPreview(URL.createObjectURL(f)); }}
          onRemove={() => { setNewImg(null); setNewImgPreview(""); }}
          label="Subcategory Image (optional)"
        />
      </div>

      {/* ---------- FILTER ---------- */}
      {cats.length > 0 && subs.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Filter:</span>
          <select
            value={filterParent}
            onChange={(e) => setFilterParent(e.target.value)}
            className="flex-1 rounded-lg border border-[#1E3A52] bg-[#13293D] px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623] cursor-pointer"
          >
            <option value="">Sab categories ki subcategories</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* ---------- LIST (grouped by parent) ---------- */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[#13293D]" />
          ))}
        </div>
      ) : filteredSubs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#1E3A52] p-6 text-center text-sm text-gray-500">
          {subs.length === 0
            ? `Koi ${label} subcategory nahi — upar se add karo`
            : "Is filter me koi subcategory nahi"}
        </p>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ cat, items }) => (
            <div key={cat._id} className="rounded-xl border border-[#1E3A52] bg-[#0D1F30] p-3">
              {/* Parent category header */}
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-sm font-bold text-white">📂 {cat.title}</p>
                <span className="rounded-full bg-[#13293D] px-2 py-0.5 text-[10px] text-gray-400">
                  {items.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {items.map((s) =>
                  editId === s._id ? (
                    /* ---------- EDIT MODE ---------- */
                    <div key={s._id} className="space-y-2 rounded-lg border border-[#F5A623]/40 bg-[#13293D] p-2.5">
                      <div className="flex gap-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          className="flex-1 rounded-lg border border-[#F5A623]/40 bg-[#0A1929] px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623]"
                        />
                        <button onClick={saveEdit} disabled={busy}
                          className="rounded-lg bg-green-600 px-3 text-white transition hover:bg-green-700 disabled:opacity-50" title="Save">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEdit} disabled={busy}
                          className="rounded-lg border border-[#1E3A52] px-3 text-gray-400 hover:text-white transition" title="Cancel">
                          <X size={14} />
                        </button>
                      </div>
                      <select
                        value={editParent}
                        onChange={(e) => setEditParent(e.target.value)}
                        className="w-full rounded-lg border border-[#1E3A52] bg-[#0A1929] px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623] cursor-pointer"
                      >
                        <option value="">-- Parent Category badlo --</option>
                        {cats.map((c) => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                      </select>
                      <ImagePicker
                        preview={editImgPreview || s.img || ""}
                        onSelect={(f) => { setEditImg(f); setEditImgPreview(URL.createObjectURL(f)); }}
                        onRemove={() => { setEditImg(null); setEditImgPreview(""); }}
                        label="Change Image (optional)"
                      />
                      <p className="text-[10px] text-gray-500">Sirf badli hui cheezein update hongi.</p>
                    </div>
                  ) : (
                    /* ---------- NORMAL ROW ---------- */
                    <div key={s._id} className="flex items-center gap-2 rounded-lg bg-[#13293D] px-3 py-2">
                      {s.img ? (
                        <img src={`${s.img}?w=60&h=60&fit=crop`} alt={s.title}
                          className="h-7 w-7 rounded object-cover" />
                      ) : (
                        <span className="text-xs text-[#F5A623]">↳</span>
                      )}
                      <span className="flex-1 truncate text-sm text-gray-200">{s.title}</span>
                      <button onClick={() => startEdit(s)}
                        className="p-1 text-gray-500 transition hover:text-blue-400" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => removeSub(s)} disabled={busy}
                        className="p-1 text-gray-500 hover:text-red-400 transition disabled:opacity-40">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}

          {/* Orphan subs (jinke parent missing hai) */}
          {orphans.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="mb-2.5 text-sm font-bold text-amber-400">⚠️ Bina parent ke subcategories</p>
              <div className="space-y-1.5">
                {orphans.map((s) =>
                  editId === s._id ? (
                    <div key={s._id} className="space-y-2 rounded-lg border border-[#F5A623]/40 bg-[#13293D] p-2.5">
                      <div className="flex gap-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 rounded-lg border border-[#F5A623]/40 bg-[#0A1929] px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623]"
                        />
                        <button onClick={saveEdit} disabled={busy}
                          className="rounded-lg bg-green-600 px-3 text-white transition hover:bg-green-700">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEdit} disabled={busy}
                          className="rounded-lg border border-[#1E3A52] px-3 text-gray-400 hover:text-white">
                          <X size={14} />
                        </button>
                      </div>
                      <select
                        value={editParent}
                        onChange={(e) => setEditParent(e.target.value)}
                        className="w-full rounded-lg border border-[#1E3A52] bg-[#0A1929] px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623] cursor-pointer"
                      >
                        <option value="">-- Parent Category select karo --</option>
                        {cats.map((c) => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div key={s._id} className="flex items-center gap-2 rounded-lg bg-[#13293D] px-3 py-2">
                      <span className="flex-1 truncate text-sm text-gray-200">{s.title}</span>
                      <button onClick={() => startEdit(s)}
                        className="p-1 text-gray-500 transition hover:text-blue-400" title="Edit (parent assign karo)">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => removeSub(s)} disabled={busy}
                        className="p-1 text-gray-500 hover:text-red-400 transition disabled:opacity-40">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAIN PAGE — 2 tabs (Product / Blog)
   ============================================================ */
type Tab = "product" | "blog";

export default function AdminSubcategoriesPage() {
  const [tab, setTab] = useState<Tab>("product");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-[#0A1929] py-6 md:py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F5A623]">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">Sub Categories 🗂️</h1>
            <p className="mt-1 text-xs text-gray-500">Product aur Blog — dono ki subcategories yahan manage karo</p>
          </div>
          <button onClick={refresh} title="Refresh"
            className="shrink-0 rounded-xl border border-[#1E3A52] p-2.5 text-gray-400 hover:border-[#F5A623] hover:text-[#F5A623] transition">
            <RefreshCw size={16} className={refreshKey % 2 ? "rotate-180" : ""} />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            { key: "product", label: "🛒 Product Subcategories" },
            { key: "blog", label: "📝 Blog Subcategories" },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); refresh(); }}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                tab === t.key
                  ? "bg-[#F5A623] text-[#0A1929]"
                  : "bg-[#13293D] text-gray-400 border border-[#1E3A52] hover:text-[#F5A623]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[#1E3A52] bg-[#0A1929]/60 p-4 md:p-6">
          {tab === "product" && (
            <SubCategoryManager
              key={`p-${refreshKey}`}
              label="product"
              subType="subcategory"
              parentType="category"
              parentField="parentCategory"
            />
          )}
          {tab === "blog" && (
            <SubCategoryManager
              key={`b-${refreshKey}`}
              label="blog"
              subType="blogSubcategory"
              parentType="blogCategory"
              parentField="parentCategory"
            />
          )}
        </div>

        <Link href="/admin" className="inline-block mt-8 text-xs text-gray-400 hover:text-[#F5A623] transition">
          ← Dashboard pe wapas
        </Link>
      </div>
    </div>
  );
}