"use client";

import { useCallback, useEffect, useState } from "react";
import { client } from "../../../lib/sanityClient";
import { adminCreate, adminDelete, adminUpdate, adminUploadImage } from "../../../lib/adminApi";
import { Trash2, Plus, RefreshCw, ImagePlus, Pencil, Check, X } from "lucide-react";

/* ============================================================
   Types
   ============================================================ */
type Cat = { _id: string; title: string; slug?: string; img?: string; _count?: number };
type SubCat = { _id: string; title: string; parentId: string; img?: string; _count?: number };
type Brand = { _id: string; title: string; _count?: number };

const inputCls =
  "w-full px-4 py-3 bg-[#13293D] border border-[#1E3A52] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);

/* ============================================================
   Image picker (reusable)
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
   Category + SubCategory Manager (Add + Edit + Delete + Image)
   ============================================================ */
function CategoryManager({
  label,
  catType,
  subType,
  subParentField,
}: {
  label: string;
  catType: string;
  subType: string;
  subParentField: string;
}) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<SubCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState("");
  const [catImage, setCatImage] = useState<File | null>(null);
  const [catImagePreview, setCatImagePreview] = useState("");
  const [newSubs, setNewSubs] = useState<Record<string, string>>({});
  const [subImages, setSubImages] = useState<Record<string, { file: File; preview: string }>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* ---------- EDIT states ---------- */
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatTitle, setEditCatTitle] = useState("");
  const [editCatImage, setEditCatImage] = useState<File | null>(null);
  const [editCatImagePreview, setEditCatImagePreview] = useState("");

  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editSubTitle, setEditSubTitle] = useState("");
  const [editSubImage, setEditSubImage] = useState<File | null>(null);
  const [editSubImagePreview, setEditSubImagePreview] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const c = await client.fetch<Cat[]>(
        `*[_type == "${catType}"] | order(coalesce(order, 9999) asc, title asc){ _id, title, "slug": slug.current, "img": image.asset->url, "_count": count(*[_type == "product" && references(^._id)]) }`
      ).catch(() => []);
      const s = await client.fetch<SubCat[]>(
        `*[_type == "${subType}"] | order(title asc){ _id, title, "parentId": ${subParentField}->_id, "img": image.asset->url }`
      ).catch(() => []);
      setCats(c ?? []);
      setSubs(s ?? []);
    } finally {
      setLoading(false);
    }
  }, [catType, subType, subParentField]);

  useEffect(() => { refresh(); }, [refresh]);

  /* ---------- ADD CATEGORY ---------- */
  const addCategory = async () => {
    const title = newCat.trim();
    if (!title) return;
    setBusy(true);
    try {
      let imageRef: any = undefined;
      if (catImage) {
        const assetId = await adminUploadImage(catImage);
        imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      }

      await adminCreate({
        _type: catType,
        title,
        slug: { _type: "slug", current: slugify(title) },
        image: imageRef,
      });
      setNewCat("");
      setCatImage(null);
      setCatImagePreview("");
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
    setBusy(false);
  };

  /* ---------- ADD SUB-CATEGORY ---------- */
  const addSub = async (parentId: string) => {
    const title = (newSubs[parentId] ?? "").trim();
    if (!title) return;
    setBusy(true);
    try {
      let imageRef: any = undefined;
      const img = subImages[parentId];
      if (img?.file) {
        const assetId = await adminUploadImage(img.file);
        imageRef = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      }

      await adminCreate({
        _type: subType,
        title,
        slug: { _type: "slug", current: slugify(title) },
        image: imageRef,
        [subParentField]: { _type: "reference", _ref: parentId },
      });
      setNewSubs((p) => ({ ...p, [parentId]: "" }));
      setSubImages((p) => {
        const n = { ...p };
        delete n[parentId];
        return n;
      });
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
    setBusy(false);
  };

  /* ---------- EDIT CATEGORY ---------- */
  const startEditCat = (c: Cat) => {
    setEditCatId(c._id);
    setEditCatTitle(c.title);
    setEditCatImage(null);
    setEditCatImagePreview(""); // purani image rehti hai jab tak nayi select na ho
  };

  const cancelEditCat = () => {
    setEditCatId(null);
    setEditCatTitle("");
    setEditCatImage(null);
    setEditCatImagePreview("");
  };

  const saveEditCat = async () => {
    if (!editCatId) return;
    const title = editCatTitle.trim();
    if (!title) return alert("Title required!");
    setBusy(true);
    try {
      const patch: any = { title };
      if (editCatImage) {
        const assetId = await adminUploadImage(editCatImage);
        patch.image = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      }
      await adminUpdate(editCatId, patch);
      cancelEditCat();
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    }
    setBusy(false);
  };

  /* ---------- EDIT SUB-CATEGORY ---------- */
  const startEditSub = (s: SubCat) => {
    setEditSubId(s._id);
    setEditSubTitle(s.title);
    setEditSubImage(null);
    setEditSubImagePreview("");
  };

  const cancelEditSub = () => {
    setEditSubId(null);
    setEditSubTitle("");
    setEditSubImage(null);
    setEditSubImagePreview("");
  };

  const saveEditSub = async () => {
    if (!editSubId) return;
    const title = editSubTitle.trim();
    if (!title) return alert("Title required!");
    setBusy(true);
    try {
      const patch: any = { title };
      if (editSubImage) {
        const assetId = await adminUploadImage(editSubImage);
        patch.image = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      }
      await adminUpdate(editSubId, patch);
      cancelEditSub();
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    }
    setBusy(false);
  };

  /* ---------- DELETE ---------- */
  const removeCat = async (c: Cat) => {
    if (!confirm(`"${c.title}" delete karein? Iske sub-categories bhi delete hongi (products safe rahenge).`)) return;
    setBusy(true);
    try {
      const childIds = subs.filter((s) => s.parentId === c._id).map((s) => s._id);
      for (const id of childIds) {
        await adminDelete(id).catch(() => {});
      }
      await adminDelete(c._id);
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
    setBusy(false);
  };

  const removeSub = async (s: SubCat) => {
    if (!confirm(`"${s.title}" delete karein?`)) return;
    setBusy(true);
    try {
      await adminDelete(s._id);
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      {/* ---------- ADD CATEGORY ---------- */}
      <div className="space-y-2 rounded-xl border border-[#1E3A52] bg-[#0D1F30]/60 p-3">
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            placeholder={`Nayi ${label} category ka naam...`}
            className={inputCls}
          />
          <button onClick={addCategory} disabled={busy || !newCat.trim()}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FFB94D] px-5 py-3 text-sm font-bold text-[#0A1929] disabled:opacity-50 flex items-center gap-1.5">
            <Plus size={15} /> Add
          </button>
        </div>
        <ImagePicker
          preview={catImagePreview}
          onSelect={(f) => { setCatImage(f); setCatImagePreview(URL.createObjectURL(f)); }}
          onRemove={() => { setCatImage(null); setCatImagePreview(""); }}
          label="Category Image (optional)"
        />
      </div>

      {/* ---------- LIST ---------- */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[#13293D]" />
          ))}
        </div>
      ) : cats.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#1E3A52] p-6 text-center text-sm text-gray-500">
          Koi category nahi — upar se add karo
        </p>
      ) : (
        <div className="space-y-2.5">
          {cats.map((c) => {
            const mySubs = subs.filter((s) => s.parentId === c._id);
            const open = openId === c._id;
            const isEditing = editCatId === c._id;
            const subImg = subImages[c._id];
            return (
              <div key={c._id} className={`rounded-xl border overflow-hidden ${
                isEditing ? "border-[#F5A623]/60 bg-[#13293D]" : "border-[#1E3A52] bg-[#0D1F30]"
              }`}>
                {/* ---------- CATEGORY ROW (ya EDIT MODE) ---------- */}
                {isEditing ? (
                  <div className="space-y-2.5 p-3">
                    <div className="flex gap-2">
                      <input
                        value={editCatTitle}
                        onChange={(e) => setEditCatTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEditCat()}
                        className={`${inputCls} border-[#F5A623]/50`}
                      />
                      <button onClick={saveEditCat} disabled={busy}
                        className="shrink-0 rounded-xl bg-green-600 px-4 text-white transition hover:bg-green-700 disabled:opacity-50" title="Save">
                        <Check size={18} />
                      </button>
                      <button onClick={cancelEditCat} disabled={busy}
                        className="shrink-0 rounded-xl border border-[#1E3A52] px-4 text-gray-400 hover:text-white transition" title="Cancel">
                        <X size={18} />
                      </button>
                    </div>
                    <ImagePicker
                      preview={editCatImagePreview || c.img || ""}
                      onSelect={(f) => { setEditCatImage(f); setEditCatImagePreview(URL.createObjectURL(f)); }}
                      onRemove={() => { setEditCatImage(null); setEditCatImagePreview(""); }}
                      label="Change Image (optional)"
                    />
                    <p className="text-[10px] text-gray-500">Sirf badli hui cheezein update hongi — image select nahi ki toh purani rahegi.</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3">
                    <button onClick={() => setOpenId(open ? null : c._id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                      <span className={`text-[10px] text-gray-500 transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
                      {c.img ? (
                        <img src={`${c.img}?w=100&h=100&fit=crop`} alt={c.title}
                          className="h-10 w-10 flex-none rounded-lg object-cover ring-1 ring-[#1E3A52]" />
                      ) : (
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#13293D] text-xs font-black text-[#F5A623]/60">
                          {c.title?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                      <span className="truncate text-sm font-bold text-white">{c.title}</span>
                      <span className="shrink-0 rounded-full bg-[#13293D] px-2 py-0.5 text-[10px] text-gray-400">
                        {mySubs.length} sub
                      </span>
                    </button>
                    <button onClick={() => startEditCat(c)}
                      className="p-2 text-gray-500 transition hover:text-blue-400" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => removeCat(c)} disabled={busy}
                      className="p-2 text-gray-500 hover:text-red-400 transition disabled:opacity-40" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}

                {open && (
                  <div className="space-y-2 border-t border-[#1E3A52] p-3">
                    {mySubs.map((s) => {
                      const isEditingSub = editSubId === s._id;
                      return isEditingSub ? (
                        /* ---------- SUB EDIT MODE ---------- */
                        <div key={s._id} className="space-y-2 rounded-lg border border-[#F5A623]/40 bg-[#13293D] p-2.5">
                          <div className="flex gap-2">
                            <input
                              value={editSubTitle}
                              onChange={(e) => setEditSubTitle(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveEditSub()}
                              className="flex-1 rounded-lg border border-[#F5A623]/40 bg-[#0A1929] px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623]"
                            />
                            <button onClick={saveEditSub} disabled={busy}
                              className="rounded-lg bg-green-600 px-3 text-white transition hover:bg-green-700 disabled:opacity-50" title="Save">
                              <Check size={14} />
                            </button>
                            <button onClick={cancelEditSub} disabled={busy}
                              className="rounded-lg border border-[#1E3A52] px-3 text-gray-400 hover:text-white transition" title="Cancel">
                              <X size={14} />
                            </button>
                          </div>
                          <ImagePicker
                            preview={editSubImagePreview || s.img || ""}
                            onSelect={(f) => { setEditSubImage(f); setEditSubImagePreview(URL.createObjectURL(f)); }}
                            onRemove={() => { setEditSubImage(null); setEditSubImagePreview(""); }}
                            label="Change Image (optional)"
                          />
                        </div>
                      ) : (
                        /* ---------- SUB NORMAL ROW ---------- */
                        <div key={s._id} className="flex items-center gap-2 rounded-lg bg-[#13293D] px-3 py-2">
                          {s.img ? (
                            <img src={`${s.img}?w=60&h=60&fit=crop`} alt={s.title}
                              className="h-7 w-7 rounded object-cover" />
                          ) : (
                            <span className="text-xs text-[#F5A623]">↳</span>
                          )}
                          <span className="flex-1 truncate text-sm text-gray-200">{s.title}</span>
                          <button onClick={() => startEditSub(s)}
                            className="p-1 text-gray-500 transition hover:text-blue-400" title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => removeSub(s)} disabled={busy}
                            className="p-1 text-gray-500 hover:text-red-400 transition disabled:opacity-40">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                    {mySubs.length === 0 && (
                      <p className="text-center text-[11px] text-gray-600 py-1">Koi sub-category nahi</p>
                    )}

                    {/* Add sub — image ke saath */}
                    <div className="space-y-2 rounded-lg bg-[#0A1929] p-2.5">
                      <div className="flex gap-2">
                        <input
                          value={newSubs[c._id] ?? ""}
                          onChange={(e) => setNewSubs((p) => ({ ...p, [c._id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && addSub(c._id)}
                          placeholder={`Nayi sub-category "${c.title}" ke liye`}
                          className="flex-1 rounded-lg border border-[#1E3A52] bg-[#13293D] px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#F5A623]"
                        />
                        <button onClick={() => addSub(c._id)} disabled={busy}
                          className="rounded-lg bg-[#1E3A52] px-3 py-2 text-xs font-bold text-white hover:bg-[#F5A623] hover:text-[#0A1929] transition disabled:opacity-40">
                          <Plus size={13} />
                        </button>
                      </div>
                      <ImagePicker
                        preview={subImg?.preview ?? ""}
                        onSelect={(f) => setSubImages((p) => ({ ...p, [c._id]: { file: f, preview: URL.createObjectURL(f) } }))}
                        onRemove={() => setSubImages((p) => {
                          const n = { ...p };
                          delete n[c._id];
                          return n;
                        })}
                        label="Sub-category Image (optional)"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Car Brands (edit ke saath)
   ============================================================ */
function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newBrand, setNewBrand] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const b = await client.fetch<Brand[]>(
        `*[_type == "carBrand"] | order(title asc){ _id, title }`
      ).catch(() => []);
      setBrands(b ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addBrand = async () => {
    const title = newBrand.trim();
    if (!title) return;
    setBusy(true);
    try {
      await adminCreate({
        _type: "carBrand",
        title,
        slug: { _type: "slug", current: slugify(title) },
      });
      setNewBrand("");
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
    setBusy(false);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const title = editTitle.trim();
    if (!title) return;
    setBusy(true);
    try {
      await adminUpdate(editId, { title });
      setEditId(null);
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    }
    setBusy(false);
  };

  const removeBrand = async (b: Brand) => {
    if (!confirm(`"${b.title}" brand delete karein?`)) return;
    setBusy(true);
    try {
      await adminDelete(b._id);
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addBrand()}
          placeholder="Naya brand (Toyota, Honda...)..." className={inputCls} />
        <button onClick={addBrand} disabled={busy || !newBrand.trim()}
          className="shrink-0 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FFB94D] px-5 py-3 text-sm font-bold text-[#0A1929] disabled:opacity-50 flex items-center gap-1.5">
          <Plus size={15} /> Add
        </button>
      </div>

      {loading ? (
        <div className="h-16 animate-pulse rounded-xl bg-[#13293D]" />
      ) : brands.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#1E3A52] p-6 text-center text-sm text-gray-500">
          Koi brand nahi — upar se add karo
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {brands.map((b) =>
            editId === b._id ? (
              <span key={b._id} className="inline-flex items-center gap-1.5 rounded-xl border border-[#F5A623]/50 bg-[#13293D] px-3 py-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  autoFocus
                  className="w-28 bg-transparent text-sm text-white outline-none"
                />
                <button onClick={saveEdit} disabled={busy} className="text-green-500 hover:text-green-400">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditId(null)} className="text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              </span>
            ) : (
              <span key={b._id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E3A52] bg-[#0D1F30] px-3.5 py-2 text-sm font-bold text-white">
                {b.title}
                <button onClick={() => { setEditId(b._id); setEditTitle(b.title); }}
                  className="text-gray-500 hover:text-blue-400 transition">
                  <Pencil size={13} />
                </button>
                <button onClick={() => removeBrand(b)} disabled={busy}
                  className="text-gray-500 hover:text-red-400 transition disabled:opacity-40">
                  <Trash2 size={13} />
                </button>
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAIN PAGE — 3 tabs
   ============================================================ */
type Tab = "product" | "blog" | "cars";

export default function AdminCategoriesPage() {
  const [tab, setTab] = useState<Tab>("product");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-[#0A1929] py-6 md:py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F5A623]">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">Categories 📂</h1>
            <p className="mt-1 text-xs text-gray-500">Products, Blog aur New Cars — teeno ki categories yahan manage karo</p>
          </div>
          <button onClick={refresh} title="Refresh"
            className="shrink-0 rounded-xl border border-[#1E3A52] p-2.5 text-gray-400 hover:border-[#F5A623] hover:text-[#F5A623] transition">
            <RefreshCw size={16} className={refreshKey % 2 ? "rotate-180" : ""} />
          </button>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {([
            { key: "product", label: "🛒 Product Categories" },
            { key: "blog", label: "📝 Blog Categories" },
            { key: "cars", label: "🚗 Car Brands" },
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
            <CategoryManager
              key={`p-${refreshKey}`}
              label="product"
              catType="category"
              subType="subcategory"
              subParentField="parentCategory"
            />
          )}
          {tab === "blog" && (
            <CategoryManager
              key={`b-${refreshKey}`}
              label="blog"
              catType="blogCategory"
              subType="blogSubcategory"
              subParentField="parentCategory"
            />
          )}
          {tab === "cars" && <BrandManager key={`c-${refreshKey}`} />}
        </div>
      </div>
    </div>
  );
}