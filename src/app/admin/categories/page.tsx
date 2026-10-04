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
   Image picker (reusable — naya image select karne ke liye)
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
   Existing image row — Replace YA Delete dono options ke saath
   ============================================================ */
function ExistingImageActions({
  imgUrl,
  alt,
  newPreview,
  onReplace,
  onClearNew,
  onDeleteFlag,
  setDeleteFlag,
  busy,
}: {
  imgUrl: string;
  alt: string;
  newPreview: string;
  onReplace: (f: File) => void;
  onClearNew: () => void;
  onDeleteFlag: boolean;
  setDeleteFlag: (v: boolean) => void;
  busy: boolean;
}) {
  if (newPreview) {
    return (
      <div className="w-fit">
        <img src={newPreview} alt="New preview" className="h-14 w-20 rounded-lg object-cover ring-1 ring-[#F5A623]/50" />
        <button type="button" onClick={onClearNew}
          className="absolute -mt-16 ml-[70px] flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">✕</button>
        <p className="mt-1 text-[9px] text-gray-500">Nayi image — Save pe upload hogi</p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <img src={`${imgUrl}?w=120&h=80&fit=crop`} alt={alt}
        className="h-14 w-20 rounded-lg object-cover ring-1 ring-[#1E3A52]" />
      <div className="flex flex-col gap-1.5">
        <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[#1E3A52] px-3 py-1.5 text-[11px] text-gray-400 transition hover:border-[#F5A623]/50 hover:text-[#F5A623]">
          <ImagePlus size={12} /> Replace Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onReplace(f);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => setDeleteFlag(!onDeleteFlag)}
          disabled={busy}
          className={`flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
            onDeleteFlag
              ? "bg-red-500/20 text-red-400"
              : "text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
          }`}
        >
          <Trash2 size={12} />
          {onDeleteFlag ? "Image delete hogi (Save dabao)" : "Delete Image"}
        </button>
      </div>
    </div>
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
  refType,   // kaunsa document type reference karta hai (product / blog)
  refField,  // us document me reference field ka naam (subcategory / blogSubcategory)
}: {
  label: string;
  catType: string;
  subType: string;
  subParentField: string;
  refType: string;
  refField: string;
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

  /* ---------- EDIT states (category) ---------- */
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatTitle, setEditCatTitle] = useState("");
  const [editCatImage, setEditCatImage] = useState<File | null>(null);
  const [editCatImagePreview, setEditCatImagePreview] = useState("");
  const [editCatRemoveImg, setEditCatRemoveImg] = useState(false); // ✅ image delete flag

  /* ---------- EDIT states (subcategory) ---------- */
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editSubTitle, setEditSubTitle] = useState("");
  const [editSubImage, setEditSubImage] = useState<File | null>(null);
  const [editSubImagePreview, setEditSubImagePreview] = useState("");
  const [editSubRemoveImg, setEditSubRemoveImg] = useState(false); // ✅ image delete flag

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const c = await client.fetch<Cat[]>(
        `*[_type == "${catType}"] | order(coalesce(order, 9999) asc, title asc){ _id, title, "slug": slug.current, "img": image.asset->url, "_count": count(*[_type == "${refType}" && references(^._id)]) }`
      ).catch(() => []);
      const s = await client.fetch<SubCat[]>(
        `*[_type == "${subType}"] | order(title asc){ _id, title, "parentId": ${subParentField}->_id, "img": image.asset->url }`
      ).catch(() => []);
      setCats(c ?? []);
      setSubs(s ?? []);
    } finally {
      setLoading(false);
    }
  }, [catType, subType, subParentField, refType]);

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
    setEditCatImagePreview("");
    setEditCatRemoveImg(false);
  };

  const cancelEditCat = () => {
    setEditCatId(null);
    setEditCatTitle("");
    setEditCatImage(null);
    setEditCatImagePreview("");
    setEditCatRemoveImg(false);
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
        await adminUpdate(editCatId, patch);
      } else if (editCatRemoveImg) {
        // ✅ Baaki fields update + image unset
        await adminUpdate(editCatId, patch);
        await client.patch(editCatId).unset(["image"]).commit();
      } else {
        await adminUpdate(editCatId, patch);
      }
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
    setEditSubRemoveImg(false);
  };

  const cancelEditSub = () => {
    setEditSubId(null);
    setEditSubTitle("");
    setEditSubImage(null);
    setEditSubImagePreview("");
    setEditSubRemoveImg(false);
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
        await adminUpdate(editSubId, patch);
      } else if (editSubRemoveImg) {
        // ✅ Baaki fields update + image unset
        await adminUpdate(editSubId, patch);
        await client.patch(editSubId).unset(["image"]).commit();
      } else {
        await adminUpdate(editSubId, patch);
      }
      cancelEditSub();
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    }
    setBusy(false);
  };

  /* ---------- DELETE SUB (reference-safe) ---------- */
  const removeSub = async (s: SubCat) => {
    setBusy(true);
    try {
      const usingDocs: { _id: string; title?: string }[] = await client
        .fetch(`*[_type == $refType && references($id)]{ _id, title }`, { refType, id: s._id })
        .catch(() => []);

      if (usingDocs.length > 0) {
        const sample = usingDocs.slice(0, 3).map((d) => `"${d.title || d._id}"`).join(", ");
        const more = usingDocs.length > 3 ? ` +${usingDocs.length - 3} more` : "";
        const force = confirm(
          `⚠️ "${s.title}" ${usingDocs.length} ${refType}(s) me use ho rahi hai:\n\n${sample}${more}\n\n` +
            `OK = Delete + un documents ka link safely hat jayega (documents delete NAHI honge)\n` +
            `Cancel = pehle manually reassign karo`
        );
        if (!force) { setBusy(false); return; }
        for (const d of usingDocs) {
          await client.patch(d._id).unset([refField]).commit().catch(() => {});
        }
      } else {
        if (!confirm(`"${s.title}" delete karein?`)) { setBusy(false); return; }
      }

      await adminDelete(s._id);
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
    setBusy(false);
  };

  /* ---------- DELETE CATEGORY (reference-safe, subs ke saath) ---------- */
  const removeCat = async (c: Cat) => {
    setBusy(true);
    try {
      const childSubs = subs.filter((s) => s.parentId === c._id);

      // Kitne documents directly category ko reference kar rahe hain
      const directUsing: { _id: string; title?: string }[] = await client
        .fetch(`*[_type == $refType && references($id)]{ _id, title }`, { refType, id: c._id })
        .catch(() => []);

      // Kitne documents child subs ko reference kar rahe hain
      let subUsingCount = 0;
      for (const s of childSubs) {
        const n = await client
          .fetch<number>(`count(*[_type == $refType && references($id)])`, { refType, id: s._id })
          .catch(() => 0);
        subUsingCount += n || 0;
      }

      const totalUsing = directUsing.length + subUsingCount;

      let msg = `"${c.title}" delete karein? Iske ${childSubs.length} sub-categories bhi delete hongi.`;
      if (totalUsing > 0) {
        msg += `\n\n⚠️ ${totalUsing} ${refType}(s) in categories/sub-categories ko use kar rahe hain.\nOK = unka link safely hat jayega (${refType}s delete NAHI honge)\nCancel = pehle manually reassign karo`;
      }
      if (!confirm(msg)) { setBusy(false); return; }

      // Direct category references unset karo
      for (const d of directUsing) {
        await client.patch(d._id).unset([refField]).commit().catch(() => {});
      }

      // Har child sub: pehle uske references unset, phir delete
      for (const s of childSubs) {
        const using: { _id: string }[] = await client
          .fetch(`*[_type == $refType && references($id)]{ _id }`, { refType, id: s._id })
          .catch(() => []);
        for (const d of using) {
          await client.patch(d._id).unset([refField]).commit().catch(() => {});
        }
        await adminDelete(s._id).catch(() => {});
      }

      await adminDelete(c._id);
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
                    {/* ✅ CATEGORY IMAGE — Replace ya Delete */}
                    {c.img || editCatImage ? (
                      <ExistingImageActions
                        imgUrl={c.img || ""}
                        alt={c.title}
                        newPreview={editCatImagePreview}
                        onReplace={(f) => { setEditCatImage(f); setEditCatImagePreview(URL.createObjectURL(f)); setEditCatRemoveImg(false); }}
                        onClearNew={() => { setEditCatImage(null); setEditCatImagePreview(""); }}
                        onDeleteFlag={editCatRemoveImg}
                        setDeleteFlag={setEditCatRemoveImg}
                        busy={busy}
                      />
                    ) : (
                      <ImagePicker
                        preview=""
                        onSelect={(f) => { setEditCatImage(f); setEditCatImagePreview(URL.createObjectURL(f)); }}
                        onRemove={() => { setEditCatImage(null); setEditCatImagePreview(""); }}
                        label="Add Image (optional)"
                      />
                    )}
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
                      {(c._count ?? 0) > 0 && (
                        <span className="shrink-0 rounded-full bg-[#F5A623]/15 px-2 py-0.5 text-[10px] font-bold text-[#F5A623]">
                          {c._count} {refType}s
                        </span>
                      )}
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
                          {/* ✅ SUB IMAGE — Replace ya Delete */}
                          {s.img || editSubImage ? (
                            <ExistingImageActions
                              imgUrl={s.img || ""}
                              alt={s.title}
                              newPreview={editSubImagePreview}
                              onReplace={(f) => { setEditSubImage(f); setEditSubImagePreview(URL.createObjectURL(f)); setEditSubRemoveImg(false); }}
                              onClearNew={() => { setEditSubImage(null); setEditSubImagePreview(""); }}
                              onDeleteFlag={editSubRemoveImg}
                              setDeleteFlag={setEditSubRemoveImg}
                              busy={busy}
                            />
                          ) : (
                            <ImagePicker
                              preview=""
                              onSelect={(f) => { setEditSubImage(f); setEditSubImagePreview(URL.createObjectURL(f)); }}
                              onRemove={() => { setEditSubImage(null); setEditSubImagePreview(""); }}
                              label="Add Image (optional)"
                            />
                          )}
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
   Car Brands (edit ke saath + reference-safe delete)
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

  /* ✅ Reference-safe delete — kaunsi cars is brand ko use kar rahi hain */
  const removeBrand = async (b: Brand) => {
    setBusy(true);
    try {
      const usingDocs: { _id: string; _type: string; title?: string }[] = await client
        .fetch(`*[references($id) && _type != "carBrand"]{ _id, _type, title }`, { id: b._id })
        .catch(() => []);

      if (usingDocs.length > 0) {
        const types = Array.from(new Set(usingDocs.map((d) => d._type))).join(", ");
        alert(
          `⚠️ "${b.title}" brand ${usingDocs.length} document(s) me use ho raha hai (${types}).\n\n` +
            `Pehle un documents se ye brand hatao, phir delete hoga.`
        );
        setBusy(false);
        return;
      }

      if (!confirm(`"${b.title}" brand delete karein?`)) { setBusy(false); return; }
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
              refType="product"
              refField="subcategory"
            />
          )}
          {tab === "blog" && (
            <CategoryManager
              key={`b-${refreshKey}`}
              label="blog"
              catType="blogCategory"
              subType="blogSubcategory"
              subParentField="parentCategory"
              refType="blog"
              refField="blogSubcategory" // ⚠️ apne blog schema ke hisaab se adjust karo
            />
          )}
          {tab === "cars" && <BrandManager key={`c-${refreshKey}`} />}
        </div>
      </div>
    </div>
  );
}