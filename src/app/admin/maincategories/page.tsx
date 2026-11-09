"use client";

import { useCallback, useEffect, useState } from "react";
import { client } from "../../../lib/sanityClient";
import { adminCreate, adminDelete, adminUpdate, adminUploadImage } from "../../../lib/adminApi";
import { Trash2, Plus, RefreshCw, ImagePlus, Pencil, Check, X } from "lucide-react";

/* ============================================================
   Main Categories Manager (3-level hierarchy ka TOP level)
   Chain: MainCategory -> Category -> SubCategory -> Product
   - Add / Edit / Delete main category (title + order + image)
   - Har main category me categories attach / detach / create
   - Reference-safe delete — categories delete NAHI hoti
   ============================================================ */

type MainCat = { _id: string; title: string; slug?: string; img?: string; order?: number | null };
type ChildCat = { _id: string; title: string; mainId?: string | null };

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
    <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#1E3A52] px-3 py-2 text-xs text-gray-500 transition hover:border-[#F5A623]/50 hover:text-[#F5A623]">
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
   MAIN CATEGORY MANAGER
   ============================================================ */
function MainCategoryManager() {
  const [mainCats, setMainCats] = useState<MainCat[]>([]);
  const [allCats, setAllCats] = useState<ChildCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  /* ---------- ADD states ---------- */
  const [newTitle, setNewTitle] = useState("");
  const [newOrder, setNewOrder] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState("");

  /* ---------- EDIT states ---------- */
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editOrder, setEditOrder] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editRemoveImg, setEditRemoveImg] = useState(false);

  /* ---------- Attach / Create child states ---------- */
  const [attachSel, setAttachSel] = useState<Record<string, string>>({});
  const [newChild, setNewChild] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const mc = await client.fetch<MainCat[]>(
        `*[_type == "mainCategory"] | order(coalesce(order, 9999) asc, title asc){ _id, title, "slug": slug.current, "img": image.asset->url, order }`
      ).catch(() => []);
      const cs = await client.fetch<ChildCat[]>(
        `*[_type == "category"] | order(title asc){ _id, title, "mainId": mainCategory->_id }`
      ).catch(() => []);
      setMainCats(mc ?? []);
      setAllCats(cs ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const childrenOf = (id: string) => allCats.filter((c) => c.mainId === id);
  const unassigned = allCats.filter((c) => !c.mainId);

  /* ---------- ADD MAIN CATEGORY ---------- */
  const addMain = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    try {
      const doc: any = {
        _type: "mainCategory",
        title,
        slug: { _type: "slug", current: slugify(title) },
      };
      if (newImage) {
        const assetId = await adminUploadImage(newImage);
        doc.image = { _type: "image", asset: { _type: "reference", _ref: assetId } };
      }
      if (newOrder.trim() !== "") doc.order = Number(newOrder);

      await adminCreate(doc);
      setNewTitle("");
      setNewOrder("");
      setNewImage(null);
      setNewImagePreview("");
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
    setBusy(false);
  };

  /* ---------- EDIT MAIN CATEGORY ---------- */
  const startEdit = (m: MainCat) => {
    setEditId(m._id);
    setEditTitle(m.title);
    setEditOrder(m.order != null ? String(m.order) : "");
    setEditImage(null);
    setEditImagePreview("");
    setEditRemoveImg(false);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditOrder("");
    setEditImage(null);
    setEditImagePreview("");
    setEditRemoveImg(false);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const title = editTitle.trim();
    if (!title) return alert("Title required!");
    setBusy(true);
    try {
      const patch: any = { title };
      if (editOrder.trim() !== "") patch.order = Number(editOrder);

      if (editImage) {
        const assetId = await adminUploadImage(editImage);
        patch.image = { _type: "image", asset: { _type: "reference", _ref: assetId } };
        await adminUpdate(editId, patch);
      } else if (editRemoveImg) {
        await adminUpdate(editId, patch);
        await client.patch(editId).unset(["image"]).commit();
      } else {
        await adminUpdate(editId, patch);
      }
      cancelEdit();
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    }
    setBusy(false);
  };

  /* ---------- DELETE MAIN CATEGORY (reference-safe) ---------- */
  const removeMain = async (m: MainCat) => {
    setBusy(true);
    try {
      const attached = await client
        .fetch<{ _id: string; title?: string }[]>(
          `*[_type == "category" && references($id)]{ _id, title }`,
          { id: m._id }
        )
        .catch(() => []);

      if (attached.length > 0) {
        const sample = attached.slice(0, 3).map((d) => `"${d.title || d._id}"`).join(", ");
        const more = attached.length > 3 ? ` +${attached.length - 3} more` : "";
        const force = confirm(
          `⚠️ "${m.title}" ke andar ${attached.length} categories lagi hui hain:\n\n${sample}${more}\n\n` +
            `OK = Main category delete hogi, lekin wo categories is group se sirf nikal jayengi (categories aur unke products delete NAHI honge)\n` +
            `Cancel = pehle categories doosre group me daalo`
        );
        if (!force) { setBusy(false); return; }
        for (const d of attached) {
          await client.patch(d._id).unset(["mainCategory"]).commit().catch(() => {});
        }
      } else {
        if (!confirm(`"${m.title}" delete karein?`)) { setBusy(false); return; }
      }

      await adminDelete(m._id);
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
    setBusy(false);
  };

  /* ---------- ATTACH existing category to this main group ---------- */
  const attachChild = async (mcId: string) => {
    const catId = attachSel[mcId];
    if (!catId) return;
    setBusy(true);
    try {
      await adminUpdate(catId, { mainCategory: { _type: "reference", _ref: mcId } });
      setAttachSel((p) => ({ ...p, [mcId]: "" }));
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Attach failed");
    }
    setBusy(false);
  };

  /* ---------- DETACH category from group (category delete NAHI hoti) ---------- */
  const detachChild = async (c: ChildCat) => {
    if (!confirm(`"${c.title}" ko is group se nikalna hai? (Category delete NAHI hogi — sirf group se bahar hogi)`)) return;
    setBusy(true);
    try {
      await client.patch(c._id).unset(["mainCategory"]).commit();
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Remove failed");
    }
    setBusy(false);
  };

  /* ---------- CREATE nayi category directly is group me ---------- */
  const addChild = async (mcId: string) => {
    const title = (newChild[mcId] ?? "").trim();
    if (!title) return;
    setBusy(true);
    try {
      await adminCreate({
        _type: "category",
        title,
        slug: { _type: "slug", current: slugify(title) },
        mainCategory: { _type: "reference", _ref: mcId },
      });
      setNewChild((p) => ({ ...p, [mcId]: "" }));
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Error");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      {/* ---------- ADD MAIN CATEGORY ---------- */}
      <div className="space-y-2 rounded-xl border border-[#1E3A52] bg-[#0D1F30]/60 p-3">
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMain()}
            placeholder="Nayi main category ka naam (e.g. Car Parts)..."
            className={inputCls}
          />
          <input
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Order"
            title="Chhota number = footer me sab se upar"
            className="w-20 shrink-0 rounded-xl border border-[#1E3A52] bg-[#13293D] px-3 text-center text-sm text-white placeholder-gray-600 outline-none focus:border-[#F5A623]"
          />
          <button onClick={addMain} disabled={busy || !newTitle.trim()}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FFB94D] px-5 py-3 text-sm font-bold text-[#0A1929] disabled:opacity-50 flex items-center gap-1.5">
            <Plus size={15} /> Add
          </button>
        </div>
        <ImagePicker
          preview={newImagePreview}
          onSelect={(f) => { setNewImage(f); setNewImagePreview(URL.createObjectURL(f)); }}
          onRemove={() => { setNewImage(null); setNewImagePreview(""); }}
          label="Main Category Image (optional)"
        />
      </div>

      {/* ---------- LIST ---------- */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[#13293D]" />
          ))}
        </div>
      ) : mainCats.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#1E3A52] p-6 text-center text-sm text-gray-500">
          Koi main category nahi — upar se add karo
        </p>
      ) : (
        <div className="space-y-2.5">
          {mainCats.map((m) => {
            const children = childrenOf(m._id);
            const open = openId === m._id;
            const isEditing = editId === m._id;
            return (
              <div key={m._id} className={`rounded-xl border overflow-hidden ${
                isEditing ? "border-[#F5A623]/60 bg-[#13293D]" : "border-[#1E3A52] bg-[#0D1F30]"
              }`}>
                {/* ---------- MAIN CAT ROW (ya EDIT MODE) ---------- */}
                {isEditing ? (
                  <div className="space-y-2.5 p-3">
                    <div className="flex gap-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className={`${inputCls} border-[#F5A623]/50`}
                      />
                      <input
                        value={editOrder}
                        onChange={(e) => setEditOrder(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="Order"
                        className="w-20 shrink-0 rounded-xl border border-[#F5A623]/50 bg-[#0A1929] px-3 text-center text-sm text-white placeholder-gray-600 outline-none focus:border-[#F5A623]"
                      />
                      <button onClick={saveEdit} disabled={busy}
                        className="shrink-0 rounded-xl bg-green-600 px-4 text-white transition hover:bg-green-700 disabled:opacity-50" title="Save">
                        <Check size={18} />
                      </button>
                      <button onClick={cancelEdit} disabled={busy}
                        className="shrink-0 rounded-xl border border-[#1E3A52] px-4 text-gray-400 hover:text-white transition" title="Cancel">
                        <X size={18} />
                      </button>
                    </div>
                    {m.img || editImage ? (
                      <ExistingImageActions
                        imgUrl={m.img || ""}
                        alt={m.title}
                        newPreview={editImagePreview}
                        onReplace={(f) => { setEditImage(f); setEditImagePreview(URL.createObjectURL(f)); setEditRemoveImg(false); }}
                        onClearNew={() => { setEditImage(null); setEditImagePreview(""); }}
                        onDeleteFlag={editRemoveImg}
                        setDeleteFlag={setEditRemoveImg}
                        busy={busy}
                      />
                    ) : (
                      <ImagePicker
                        preview=""
                        onSelect={(f) => { setEditImage(f); setEditImagePreview(URL.createObjectURL(f)); }}
                        onRemove={() => { setEditImage(null); setEditImagePreview(""); }}
                        label="Add Image (optional)"
                      />
                    )}
                    <p className="text-[10px] text-gray-500">Order khali chhoda to order nahi badlega. Chhota number = footer me sab se upar.</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3">
                    <button onClick={() => setOpenId(open ? null : m._id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                      <span className={`text-[10px] text-gray-500 transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
                      {m.img ? (
                        <img src={`${m.img}?w=100&h=100&fit=crop`} alt={m.title}
                          className="h-10 w-10 flex-none rounded-lg object-cover ring-1 ring-[#1E3A52]" />
                      ) : (
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#13293D] text-base">🌟</span>
                      )}
                      <span className="truncate text-sm font-bold text-white">{m.title}</span>
                      <span className="shrink-0 rounded-full bg-[#13293D] px-2 py-0.5 text-[10px] text-gray-400">
                        {children.length} categories
                      </span>
                      {m.order != null && (
                        <span className="shrink-0 rounded-full bg-[#F5A623]/15 px-2 py-0.5 text-[10px] font-bold text-[#F5A623]">
                          #{m.order}
                        </span>
                      )}
                    </button>
                    <button onClick={() => startEdit(m)}
                      className="p-2 text-gray-500 transition hover:text-blue-400" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => removeMain(m)} disabled={busy}
                      className="p-2 text-gray-500 hover:text-red-400 transition disabled:opacity-40" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}

                {/* ---------- EXPANDED: categories inside this main group ---------- */}
                {open && (
                  <div className="space-y-2 border-t border-[#1E3A52] p-3">
                    {children.map((c) => (
                      <div key={c._id} className="flex items-center gap-2 rounded-lg bg-[#13293D] px-3 py-2">
                        <span className="text-xs text-[#F5A623]">↳</span>
                        <span className="flex-1 truncate text-sm text-gray-200">{c.title}</span>
                        <button onClick={() => detachChild(c)} disabled={busy}
                          className="p-1 text-gray-500 hover:text-red-400 transition disabled:opacity-40" title="Group se nikalo">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    {children.length === 0 && (
                      <p className="py-1 text-center text-[11px] text-gray-600">Is group me abhi koi category nahi</p>
                    )}

                    {/* Attach existing unassigned category */}
                    <div className="flex gap-2 rounded-lg bg-[#0A1929] p-2.5">
                      <select
                        value={attachSel[m._id] ?? ""}
                        onChange={(e) => setAttachSel((p) => ({ ...p, [m._id]: e.target.value }))}
                        className="flex-1 rounded-lg border border-[#1E3A52] bg-[#13293D] px-3 py-2 text-xs text-white outline-none focus:border-[#F5A623]"
                      >
                        <option value="">— Existing category attach karo —</option>
                        {unassigned.map((u) => (
                          <option key={u._id} value={u._id}>{u.title}</option>
                        ))}
                      </select>
                      <button onClick={() => attachChild(m._id)} disabled={busy || !attachSel[m._id]}
                        className="rounded-lg bg-[#1E3A52] px-3 py-2 text-xs font-bold text-white hover:bg-[#F5A623] hover:text-[#0A1929] transition disabled:opacity-40">
                        Attach
                      </button>
                    </div>

                    {/* Ya nayi category banao is group me */}
                    <div className="flex gap-2 rounded-lg bg-[#0A1929] p-2.5">
                      <input
                        value={newChild[m._id] ?? ""}
                        onChange={(e) => setNewChild((p) => ({ ...p, [m._id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addChild(m._id)}
                        placeholder={`Nayi category "${m.title}" ke andar banao...`}
                        className="flex-1 rounded-lg border border-[#1E3A52] bg-[#13293D] px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#F5A623]"
                      />
                      <button onClick={() => addChild(m._id)} disabled={busy || !(newChild[m._id] ?? "").trim()}
                        className="rounded-lg bg-[#1E3A52] px-3 py-2 text-xs font-bold text-white hover:bg-[#F5A623] hover:text-[#0A1929] transition disabled:opacity-40">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <p className="rounded-xl border border-dashed border-[#1E3A52] p-3 text-center text-[11px] text-gray-500">
              💡 {unassigned.length} categories abhi kisi group me nahi — unhe kisi bhi main category me Attach kar sakte ho
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PAGE SHELL
   ============================================================ */
export default function AdminMainCategoriesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-[#0A1929] py-6 md:py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F5A623]">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">Main Categories 🌟</h1>
            <p className="mt-1 text-xs text-gray-500">
              Top-level groups — Chain: Main Category → Category → Sub Category
            </p>
          </div>
          <button onClick={refresh} title="Refresh"
            className="shrink-0 rounded-xl border border-[#1E3A52] p-2.5 text-gray-400 hover:border-[#F5A623] hover:text-[#F5A623] transition">
            <RefreshCw size={16} className={refreshKey % 2 ? "rotate-180" : ""} />
          </button>
        </div>

        <div className="rounded-2xl border border-[#1E3A52] bg-[#0A1929]/60 p-4 md:p-6">
          <MainCategoryManager key={`m-${refreshKey}`} />
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-600">
          Categories aur Sub-Categories ke liye <span className="font-bold text-gray-500">Categories 📂</span> page use karo — ye page sirf top-level groups manage karta hai
        </p>
      </div>
    </div>
  );
}