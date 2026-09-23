"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { client } from "../lib/sanityClient";

const ReactQuill: any = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const getSlug = (slug: any): string => {
  if (!slug) return "";
  if (typeof slug === "string") return slug;
  return slug.current || "";
};

/* ============================================================
   API HELPERS
============================================================ */

async function apiSaveBlog(doc: any) {
  const res = await fetch("/api/admin/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doc }),
  });
  const r = await res.json();
  if (!r.success) throw new Error(r.error || "Save failed");
  return r.data;
}

async function apiUpdateBlog(id: string, patch: any) {
  const res = await fetch("/api/admin/blog", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, patch }),
  });
  const r = await res.json();
  if (!r.success) throw new Error(r.error || "Update failed");
  return r.data;
}

async function apiAddCategory(title: string, slug: string) {
  const res = await fetch("/api/admin/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "category", title, slug }),
  });
  const r = await res.json();
  if (!r.success) throw new Error(r.error || "Failed");
  return r.data;
}

async function apiAddSubCategory(title: string, slug: string, parentId: string) {
  const res = await fetch("/api/admin/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "subcategory", title, slug, parentId }),
  });
  const r = await res.json();
  if (!r.success) throw new Error(r.error || "Failed");
  return r.data;
}

async function apiUploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/blog", { method: "PUT", body: fd });
  const r = await res.json();
  if (!r.success) throw new Error(r.error || "Upload failed");
  return r.assetId;
}

/* ============================================================
   TOOLBAR
============================================================ */
const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
      [{ align: [] }],
      ["blockquote", "code-block"],
      ["link", "video"],
      ["clean"],
    ],
  },
};

const contentParts = Array.from({ length: 10 }, (_, i) => ({
  key: String(i + 1),
  label: `P${i + 1}`,
}));

type ChartItem = { label: string; value: string };

export default function BlogForm({
  catList = [],
  subCatList = [],
  onSaved,
  editing = null,
  onCancelEdit,
}: {
  catList?: any[];
  subCatList?: any[];
  onSaved?: () => void;
  editing?: any;
  onCancelEdit?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const activePartRef = useRef("1");

  const [activePart, setActivePart] = useState("1");
  const [blogTitle, setBlogTitle] = useState("");
  const [blogCategory, setBlogCategory] = useState("");
  const [blogSubCategory, setBlogSubCategory] = useState("");
  const [blogDesc, setBlogDesc] = useState("");
  const [writerName, setWriterName] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [blogContents, setBlogContents] = useState<string[]>(Array(10).fill(""));
  const [blogImages, setBlogImages] = useState<{ url: string; assetId: string }[]>(
    Array(10).fill({ url: "", assetId: "" })
  );
  const [blogPublished, setBlogPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedParts, setSavedParts] = useState<Set<number>>(new Set());

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isAddingSubCat, setIsAddingSubCat] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState("");

  /* ============================================================
     EDIT MODE — prefill
     ✅ editSlug/editDate bhi save karte hain taake
     ✅ Update pe slug aur date UNCHANGED rahein (backlinks safe)
  ============================================================ */
  const [editId, setEditId] = useState<string | null>(editing?._id ?? null);
  const [editSlug, setEditSlug] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");

  useEffect(() => {
    if (!editing) return;
    setEditId(editing._id);
    /* ✅ Original slug + date store — update mein inhe touch nahi karenge */
    setEditSlug(getSlug(editing.slug) || "");
    setEditDate(editing.date || "");
    setBlogTitle(editing.title || "");
    setBlogDesc(editing.desc || "");
    setWriterName(editing.writerName || "");
    setSeoTitle(editing.seoTitle || "");
    setSeoDesc(editing.seoDesc || "");
    setBlogPublished(!!editing.isPublished);
    setBlogCategory(editing.category ? getSlug(editing.category.slug || editing.category) : "");
    setBlogSubCategory(editing.subCategory ? getSlug(editing.subCategory.slug || editing.subCategory) : "");

    /* 10 parts + images prefill */
    const contents = Array(10).fill("");
    const images = Array(10).fill({ url: "", assetId: "" });
    for (let i = 0; i < 10; i++) {
      if (editing[`content${i + 1}`]) contents[i] = editing[`content${i + 1}`];
      const u = editing[`img${i + 1}Url`];
      if (u) images[i] = { url: u, assetId: `existing-${i}` }; // marker: untouched image
    }
    setBlogContents(contents);
    setBlogImages(images);
    activePartRef.current = "1";
    setActivePart("1");
  }, [editing]);

  /* ============================================================
     LOCAL LISTS — add ke baad form reset na ho
  ============================================================ */
  const [localCats, setLocalCats] = useState<any[]>(catList);
  const [localSubs, setLocalSubs] = useState<any[]>(subCatList);

  const fetchLocalLists = useCallback(async () => {
    try {
      const [cats, subs] = await Promise.all([
        client.fetch<any[]>(
          `*[_type == "blogCategory"] | order(title asc){ _id, title, "slug": slug.current }`
        ),
        client.fetch<any[]>(
          `*[_type == "blogSubcategory"] | order(title asc){ _id, title, "slug": slug.current, "parentId": parentCategory->_id }`
        ),
      ]);
      if (cats?.length) setLocalCats(cats);
      if (subs?.length) setLocalSubs(subs);
    } catch {
      /* fallback: props wali lists rehti hain */
    }
  }, []);

  const [chartOpen, setChartOpen] = useState(false);
  const [chartTitle, setChartTitle] = useState("Comparison");
  const [chartItems, setChartItems] = useState<ChartItem[]>([
    { label: "Item 1", value: "50" },
    { label: "Item 2", value: "80" },
  ]);

  const selectedCat = localCats.find((c) => getSlug(c.slug) === blogCategory);
  const availableSubCats = selectedCat
    ? localSubs.filter((s) => s.parentId === selectedCat._id)
    : [];
  const selectedSubCat = availableSubCats.find((s) => getSlug(s.slug) === blogSubCategory);

  /* ============================================================
     PART SAVE SYSTEM
     ============================================================ */
  const flushCurrentPart = () => {
    const editor = editorRef.current;
    if (!editor?.root) return;
    const idx = parseInt(activePartRef.current, 10) - 1;
    const html = editor.root.innerHTML;
    const cleaned = html === "<p><br></p>" ? "" : html;
    setBlogContents((prev) => {
      if (prev[idx] === cleaned) return prev;
      const n = [...prev];
      n[idx] = cleaned;
      return n;
    });
  };

  const switchPart = (key: string) => {
    if (key === activePartRef.current) return;
    flushCurrentPart();
    activePartRef.current = key;
    setActivePart(key);
  };

  const saveCurrentPart = () => {
    flushCurrentPart();
    setSavedParts((prev) => new Set(prev).add(parseInt(activePartRef.current, 10) - 1));
  };

  /* ============================================================
     INSERT HELPERS
     ============================================================ */
  const insertHtml = (html: string) => {
    const editor = editorRef.current;
    if (!editor?.clipboard) {
      alert("Editor abhi load ho raha hai — pehle editor mein kuch type karo, phir try karo.");
      return;
    }
    const range = editor.getSelection(true);
    const index = range?.index ?? 0;
    editor.clipboard.dangerouslyPasteHTML(index, html, "user");
    editor.setSelection(index + 1, 0, "user");
  };

  const insertTable = () => {
    const rows = Math.min(20, Math.max(1, parseInt(prompt("Kitni rows?", "3") || "3", 10)));
    const cols = Math.min(6, Math.max(1, parseInt(prompt("Kitne columns?", "3") || "3", 10)));
    if (!rows || !cols) return;

    let html = '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        html += r === 0
          ? `<th style="border:1px solid #d1d5db;padding:8px 10px;background:#F5A623;color:#0A1929;text-align:left;">Heading ${c + 1}</th>`
          : `<td style="border:1px solid #d1d5db;padding:8px 10px;">—</td>`;
      }
      html += "</tr>";
    }
    html += "</table><p><br/></p>";
    insertHtml(html);
  };

  const generateChartHtml = (title: string, items: ChartItem[]) => {
    const valid = items.filter((i) => i.label.trim());
    if (!valid.length) return "";
    const max = Math.max(...valid.map((i) => parseFloat(i.value) || 0), 1);

    const bars = valid
      .map((i) => {
        const v = parseFloat(i.value) || 0;
        const w = Math.round((v / max) * 100);
        return `<div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;">
            <strong>${i.label}</strong><span style="color:#F5A623;font-weight:bold;">${i.value}</span>
          </div>
          <div style="background:rgba(128,128,128,0.15);height:14px;border-radius:7px;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#F5A623,#FFB94D);height:100%;width:${w}%;border-radius:7px;"></div>
          </div>
        </div>`;
      })
      .join("");

    return `<div style="border:1px solid rgba(128,128,128,0.25);border-radius:12px;padding:16px;margin:12px 0;">
      <div style="font-weight:bold;font-size:15px;margin-bottom:12px;">📊 ${title}</div>
      ${bars}
    </div><p><br/></p>`;
  };

  const insertChart = () => {
    const html = generateChartHtml(chartTitle, chartItems);
    if (!html) return alert("Kam az kam 1 item label do!");
    insertHtml(html);
    setChartOpen(false);
  };

  /* ============================================================
     CRUD — Category / SubCategory
     ============================================================ */
  const handleAddCategory = async () => {
    if (!newCatName) return alert("Category name required");
    const sl = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try {
      await apiAddCategory(newCatName, sl);
      setIsAddingCat(false);
      setNewCatName("");
      await fetchLocalLists();
      setBlogCategory(sl);
    } catch (e: any) {
      alert(e?.message || "Error adding category");
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCatName) return alert("Sub-category name required");
    if (!selectedCat) return alert("Select main category first");
    const sl = newSubCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    try {
      await apiAddSubCategory(newSubCatName, sl, selectedCat._id);
      setIsAddingSubCat(false);
      setNewSubCatName("");
      await fetchLocalLists();
      setBlogSubCategory(sl);
    } catch (e: any) {
      alert(e?.message || "Error saving sub-category");
    }
  };

  /* ============================================================
     IMAGE UPLOAD
     ============================================================ */
  const handleImageUpload = async (e: any, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const assetId = await apiUploadImage(file);
      setBlogImages((prev) => {
        const n = [...prev];
        n[index] = { url: URL.createObjectURL(file), assetId };
        return n;
      });
    } catch (err: any) {
      alert(err?.message || "Upload failed");
    }
  };

  const removeImage = (index: number) => {
    setBlogImages((prev) => {
      const n = [...prev];
      n[index] = { url: "", assetId: "" };
      return n;
    });
  };

  /* ============================================================
     SAVE BLOG — create YA update
     ✅ UPDATE mein: slug + date UNCHANGED (SEO/backlinks safe)
     ✅ UPDATE mein: sirf NAYI images bhejti hain (existing skip)
  ============================================================ */
  const handleSave = async () => {
    if (!blogTitle) return alert("Title required!");
    setSaving(true);

    /* Current editor ka fresh content flush */
    const currentIdx = parseInt(activePartRef.current, 10) - 1;
    const editorHtml = editorRef.current?.root?.innerHTML;
    const finalContents = [...blogContents];
    if (editorHtml) {
      finalContents[currentIdx] = editorHtml === "<p><br></p>" ? "" : editorHtml;
    }

    try {
      if (editId) {
        /* ============================================================
           ✅ UPDATE MODE
           - slug: UNCHANGED (editSlug use hota hai, naya nahi banta)
           - date: UNCHANGED (editDate rehta hai)
           - images: sirf NAYI uploaded (existing-* skip)
        ============================================================ */

        /* Sirf NAYI images (jo user ne edit ke dauran upload ki) */
        const newImages: Record<string, any> = {};
        for (let i = 0; i < 10; i++) {
          const bid = blogImages[i].assetId;
          if (bid && !bid.startsWith("existing")) {
            newImages[`img${i + 1}`] = {
              _type: "image",
              asset: { _type: "reference", _ref: bid },
            };
          }
        }

        /* Sirf badle hue content parts bhejo (undefined skip) */
        const contentPatch: Record<string, any> = {};
        for (let i = 0; i < 10; i++) {
          if (finalContents[i] !== undefined && finalContents[i] !== "") {
            contentPatch[`content${i + 1}`] = finalContents[i];
          }
        }

        await apiUpdateBlog(editId, {
          title: blogTitle,
          desc: blogDesc,
          category: selectedCat ? { _type: "reference", _ref: selectedCat._id } : undefined,
          subCategory: selectedSubCat ? { _type: "reference", _ref: selectedSubCat._id } : undefined,
          writerName: writerName || undefined,
          seoTitle: seoTitle || undefined,
          seoDesc: seoDesc || undefined,
          isPublished: blogPublished,
          ...contentPatch,
          ...newImages,
          /* ❌ slug: NAHI bheja — original slug intact (backlinks safe) */
          /* ❌ date: NAHI bheja — original date intact */
        });

        alert("Blog Updated! (URL unchanged — backlinks safe)");
        if (onSaved) onSaved();
      } else {
        /* ============================================================
           CREATE MODE
        ============================================================ */
        const sl =
          blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90) +
          "-" +
          Date.now().toString(36).slice(-4);

        const docData: any = {
          _type: "blog",
          title: blogTitle,
          slug: { _type: "slug", current: sl },
          desc: blogDesc,
          category: selectedCat ? { _type: "reference", _ref: selectedCat._id } : undefined,
          subCategory: selectedSubCat ? { _type: "reference", _ref: selectedSubCat._id } : undefined,
          writerName: writerName || undefined,
          seoTitle: seoTitle || undefined,
          seoDesc: seoDesc || undefined,
          isPublished: blogPublished,
          date: new Date().toISOString(),
        };
        for (let i = 0; i < 10; i++) {
          docData[`content${i + 1}`] = finalContents[i] || undefined;
          if (blogImages[i].assetId) {
            docData[`img${i + 1}`] = {
              _type: "image",
              asset: { _type: "reference", _ref: blogImages[i].assetId },
            };
          }
        }

        await apiSaveBlog(docData);
        alert("Blog Post Saved!");
        setBlogTitle("");
        setBlogDesc("");
        setWriterName("");
        setSeoTitle("");
        setSeoDesc("");
        setBlogCategory("");
        setBlogSubCategory("");
        setBlogPublished(false);
        setBlogContents(Array(10).fill(""));
        setBlogImages(Array(10).fill({ url: "", assetId: "" }));
        setSavedParts(new Set());
        activePartRef.current = "1";
        setActivePart("1");
        if (onSaved) onSaved();
      }
    } catch (e: any) {
      alert(e?.message || "Error saving post");
    }
    setSaving(false);
  };

  const currentPartIndex = parseInt(activePart) - 1;
  const currentContent = blogContents[currentPartIndex] || "";
  const wordCount = currentContent.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  /* ---------- Theme-aware classes ---------- */
  const inputCls =
    "w-full px-4 py-3 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#F5A623] transition-colors";

  return (
    <div className="bg-white dark:bg-[#0D1F30] border border-gray-200 dark:border-[#1E3A52] rounded-2xl p-4 md:p-6 shadow-sm max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {editId ? "✏️ Edit Blog Post" : "Create New Blog Post"}
        </h2>
        {saving && <span className="text-xs text-[#F5A623] font-bold animate-pulse">Saving…</span>}
      </div>

      {/* ✅ Edit mode mein URL info — user ko pata ho ke slug change nahi hoga */}
      {editId && editSlug && (
        <div className="rounded-xl bg-amber-50 dark:bg-[#F5A623]/10 border border-amber-200 dark:border-[#F5A623]/20 px-4 py-2.5">
          <p className="text-[10px] font-bold text-amber-700 dark:text-[#F5A623]">
            🔒 URL (locked — backlinks safe): /blog/{editSlug}
          </p>
          <p className="text-[9px] text-gray-500 mt-0.5">
            Title change karne se URL nahi badalta — SEO safe.
          </p>
        </div>
      )}

      {/* Title */}
      <input type="text" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)}
        placeholder="Blog Title *" className={inputCls} />

      {/* Description */}
      <div>
        <textarea value={blogDesc} onChange={(e) => setBlogDesc(e.target.value)} rows={2}
          placeholder="Short Description (excerpt)" maxLength={200}
          className={`${inputCls} resize-none`} />
        <p className="text-[10px] text-gray-400 text-right">{blogDesc.length}/200</p>
      </div>

      <input type="text" value={writerName} onChange={(e) => setWriterName(e.target.value)}
        placeholder="Writer Name (e.g. Ahmed Ali)" className={inputCls} />

      {/* Category + Sub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          {!isAddingCat ? (
            <select value={blogCategory} onChange={(e) => { setBlogCategory(e.target.value); setBlogSubCategory(""); }}
              className={inputCls}>
              <option value="">Select Category</option>
              {localCats.map((c: any) => (
                <option key={c._id} value={getSlug(c.slug)}>{c.title}</option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="New Category Name" className={inputCls} />
              <button onClick={handleAddCategory} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Save</button>
              <button onClick={() => setIsAddingCat(false)} className="px-3 py-2 border border-gray-200 dark:border-[#1E3A52] text-gray-400 rounded-lg text-sm">✕</button>
            </div>
          )}
          <button type="button" onClick={() => setIsAddingCat(!isAddingCat)}
            className="text-[11px] font-semibold text-[#F5A623] w-fit">
            {isAddingCat ? "← Back to Select" : "+ Add New Category"}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {!isAddingSubCat ? (
            <select value={blogSubCategory} onChange={(e) => setBlogSubCategory(e.target.value)}
              disabled={!blogCategory} className={`${inputCls} disabled:opacity-50`}>
              <option value="">Select Sub-Category</option>
              {availableSubCats.map((s: any) => (
                <option key={s._id} value={getSlug(s.slug)}>{s.title}</option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={newSubCatName} onChange={(e) => setNewSubCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubCategory()}
                placeholder="New Sub-Category" className={inputCls} />
              <button onClick={handleAddSubCategory} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Save</button>
              <button onClick={() => setIsAddingSubCat(false)} className="px-3 py-2 border border-gray-200 dark:border-[#1E3A52] text-gray-400 rounded-lg text-sm">✕</button>
            </div>
          )}
          <button type="button" onClick={() => setIsAddingSubCat(!isAddingSubCat)}
            disabled={!blogCategory}
            className="text-[11px] font-semibold text-[#F5A623] w-fit disabled:opacity-50">
            {isAddingSubCat ? "← Back to Select" : "+ Add New Sub-Category"}
          </button>
        </div>
      </div>

      {/* SEO */}
      <div className="p-4 bg-gray-50 dark:bg-[#13293D]/60 border border-gray-200 dark:border-[#1E3A52] rounded-xl space-y-3">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">SEO (Optional)</p>
        <div>
          <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="SEO Title (Google mein jo dikhe)" maxLength={70} className={inputCls} />
          <p className={`text-[10px] text-right mt-0.5 ${seoTitle.length > 60 ? "text-red-400" : "text-gray-400"}`}>
            {seoTitle.length}/60
          </p>
        </div>
        <div>
          <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)}
            placeholder="SEO Description (150-160 characters)" rows={2} maxLength={170}
            className={`${inputCls} resize-none`} />
          <p className={`text-[10px] text-right mt-0.5 ${seoDesc.length > 160 ? "text-red-400" : "text-gray-400"}`}>
            {seoDesc.length}/160
          </p>
        </div>
      </div>

      {/* ================= CONTENT PARTS (tabs) ================= */}
      <div className="border border-gray-200 dark:border-[#1E3A52] rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto bg-gray-50 dark:bg-[#13293D]/60 border-b border-gray-200 dark:border-[#1E3A52]">
          {contentParts.map((p) => {
            const idx = parseInt(p.key) - 1;
            const filled = blogContents[idx]?.replace(/<[^>]*>/g, "").trim() || blogImages[idx]?.assetId;
            const isSaved = savedParts.has(idx);
            return (
              <button key={p.key} onClick={() => switchPart(p.key)}
                className={`flex-shrink-0 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activePart === p.key
                    ? "bg-white dark:bg-[#0D1F30] text-[#F5A623] border-[#F5A623]"
                    : filled
                    ? "text-gray-700 dark:text-gray-300 border-green-400"
                    : "text-gray-400 border-transparent"
                }`}>
                {isSaved ? "✓" : filled ? "● " : ""}{p.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Insert:</span>
            <button type="button" onClick={insertTable}
              className="px-3 py-1.5 rounded-lg bg-[#F5A623]/10 text-[#F5A623] text-xs font-bold hover:bg-[#F5A623]/20 transition">
              Table
            </button>
            <button type="button" onClick={() => setChartOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#F5A623]/10 text-[#F5A623] text-xs font-bold hover:bg-[#F5A623]/20 transition">
              Chart
            </button>
            <button type="button" onClick={saveCurrentPart}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition">
              Save Part {activePart}
            </button>
            <span className="ml-auto text-[10px] text-gray-400">
              {savedParts.has(currentPartIndex) && "✓ Saved • "}
              {wordCount} words • Part {activePart}
            </span>
          </div>

          <div className="border border-gray-200 dark:border-[#1E3A52] rounded-xl overflow-hidden bg-white dark:bg-[#0A1929]">
            <ReactQuill
              ref={(el: any) => {
                if (el?.getEditor) editorRef.current = el.getEditor();
              }}
              theme="snow"
              value={currentContent}
              onChange={(val: string, _delta: any, _source: any, editor: any) => {
                if (editor) editorRef.current = editor;
                setBlogContents((prev) => {
                  const n = [...prev];
                  n[currentPartIndex] = val;
                  return n;
                });
              }}
              modules={quillModules}
              className="h-60 sm:h-72 pb-12 text-gray-900 dark:text-white"
            />
          </div>

          {/* Part image */}
          <div className="border border-dashed border-gray-200 dark:border-[#1E3A52] rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                Upload Image for Part {activePart}
                {/* ✅ Edit mode: existing image ka hint */}
                {blogImages[currentPartIndex]?.assetId?.startsWith("existing") && (
                  <span className="ml-1 text-[9px] text-gray-400">(existing — change karne ke liye nayi upload karo)</span>
                )}
              </label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, currentPartIndex)}
                className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#F5A623]/10 file:text-[#F5A623] cursor-pointer" />
            </div>
            {blogImages[currentPartIndex]?.url && (
              <div className="relative">
                <img src={blogImages[currentPartIndex].url} alt="Preview"
                  className="rounded-lg w-20 h-20 object-cover" />
                <button type="button" onClick={() => removeImage(currentPartIndex)}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full text-xs">✕</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#13293D]/60 border border-gray-200 dark:border-[#1E3A52] rounded-xl">
        <div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Publish Now?</span>
          <p className="text-[10px] text-gray-400">{blogPublished ? "Blog turant site pe live hoga" : "Draft ke tor pe save hoga"}</p>
        </div>
        <button onClick={() => setBlogPublished(!blogPublished)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            blogPublished ? "bg-green-500" : "bg-gray-300 dark:bg-[#1E3A52]"
          }`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            blogPublished ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
      </div>

      {/* Save / Update */}
      <button onClick={handleSave} disabled={saving}
        className="w-full bg-[#F5A623] hover:bg-[#D4911E] disabled:opacity-50 text-[#0A1929] font-bold py-3 rounded-xl text-sm transition-colors">
        {saving ? "Saving..." : editId ? "Update Blog Post" : "Save Blog Post"}
      </button>

      {editId && (
        <button onClick={() => onCancelEdit?.()}
          className="w-full border border-gray-200 dark:border-[#1E3A52] text-gray-500 dark:text-gray-400 font-bold py-3 rounded-xl text-sm transition-colors hover:text-gray-900 dark:hover:text-white">
          Cancel Edit
        </button>
      )}

      {/* ================= CHART MODAL ================= */}
      {chartOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setChartOpen(false)}>
          <div className="w-full sm:max-w-md bg-white dark:bg-[#0D1F30] rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Chart Banao</h3>

            <input type="text" value={chartTitle} onChange={(e) => setChartTitle(e.target.value)}
              placeholder="Chart ka title (e.g. Oil Prices 2025)"
              className={`${inputCls} mb-3`} />

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chartItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" value={item.label}
                    onChange={(e) => setChartItems((prev) => prev.map((it, j) => j === i ? { ...it, label: e.target.value } : it))}
                    placeholder={`Label ${i + 1}`} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-lg text-xs text-gray-900 dark:text-white" />
                  <input type="number" value={item.value}
                    onChange={(e) => setChartItems((prev) => prev.map((it, j) => j === i ? { ...it, value: e.target.value } : it))}
                    placeholder="Value" className="w-20 px-3 py-2 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-lg text-xs text-gray-900 dark:text-white" />
                  {chartItems.length > 1 && (
                    <button onClick={() => setChartItems((prev) => prev.filter((_, j) => j !== i))}
                      className="text-red-400 text-sm">✕</button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setChartItems((prev) => [...prev, { label: "", value: "" }])}
              className="mt-2 text-[11px] font-bold text-[#F5A623]">+ Add Item</button>

            <div className="mt-3 p-3 bg-gray-50 dark:bg-[#13293D]/60 rounded-xl border border-gray-100 dark:border-[#1E3A52]">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Preview</p>
              <p className="text-xs font-bold mb-2 text-gray-900 dark:text-white">{chartTitle}</p>
              {chartItems.filter((i) => i.label).map((i, idx) => {
                const max = Math.max(...chartItems.map((x) => parseFloat(x.value) || 0), 1);
                const w = Math.round(((parseFloat(i.value) || 0) / max) * 100);
                return (
                  <div key={idx} className="mb-1.5">
                    <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400"><span>{i.label}</span><span>{i.value}</span></div>
                    <div className="bg-gray-200 dark:bg-[#1E3A52] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#F5A623] h-full rounded-full" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={insertChart}
                className="flex-1 bg-[#F5A623] text-[#0A1929] font-bold py-2.5 rounded-xl text-sm">Insert into Part {activePart}</button>
              <button onClick={() => setChartOpen(false)}
                className="px-4 border border-gray-200 dark:border-[#1E3A52] rounded-xl text-sm text-gray-500 dark:text-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}