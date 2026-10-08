"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as any;
import "react-quill-new/dist/quill.snow.css";

/* ============================================================
   API HELPERS — AutoBrothers /api/admin/blog
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
   TYPES + HELPERS
============================================================ */

interface ImageState { url: string; assetId: string; }
interface TableEntry { id: string; html: string; }
type SanityImageRef = { _type: "image"; asset: { _ref: string; _type: "reference" } };

export const getSlug = (slug: any): string => {
  if (!slug) return "";
  if (typeof slug === "string") return slug;
  return slug.current || "";
};

const LOGO_URL = "/logo.png";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 90);

const sanitizeQuill = (html: string): string => {
  if (!html) return "";
  let cleanHtml = html.replace(/(<img[^>]*?)\s(width|height)="[^"]*"/gi, "$1");
  cleanHtml = cleanHtml.replace(
    /<img(?![^>]*\sstyle=")/gi,
    '<img style="max-width:100%; height:auto; border-radius:8px; margin:15px 0; box-shadow:0 4px 6px rgba(0,0,0,0.1);"'
  );
  cleanHtml = cleanHtml.replace(
    /(<img[^>]*?style=")([^"]*)"/gi,
    '$1max-width:100%; height:auto; border-radius:8px; margin:15px 0; box-shadow:0 4px 6px rgba(0,0,0,0.1); $2"'
  );
  return cleanHtml;
};

const getWordCount = (html: string): number => {
  if (!html) return 0;
  const t = html
    .replace(/\[\[TABLE:[A-Za-z0-9_]+\]\]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
  return t ? t.split(/\s+/).length : 0;
};

/* ============================================================
   TABLE MARKER SYSTEM
============================================================ */

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MARKER_STYLE = "background-color:#FEF3C7; color:#92400E;";

const styledMarker = (id: string): string =>
  `<span style="${MARKER_STYLE}"><strong>[[TABLE:${id}]]</strong></span>`;

const stripMarker = (html: string, id: string): string => {
  const idEsc = escapeRe(id);
  let out = html.replace(
    new RegExp(`<p[^>]*>\\s*(?:<(?:span|strong|b|em|i)[^>]*>){0,3}\\s*\\[\\[TABLE:${idEsc}\\]\\]\\s*(?:<\\/(?:span|strong|b|em|i)>){0,3}\\s*<\\/p>`, "g"),
    ""
  );
  out = out.replace(
    new RegExp(`(?:<(?:span|strong|b|em|i)[^>]*>){0,3}\\s*\\[\\[TABLE:${idEsc}\\]\\]\\s*(?:<\\/(?:span|strong|b|em|i)>){0,3}`, "g"),
    ""
  );
  out = out.replace(new RegExp(`\\[\\[TABLE:${idEsc}\\]\\]`, "g"), "");
  return out;
};

const replaceMarkerWithHtml = (html: string, id: string, tableHtml: string): string => {
  const idEsc = escapeRe(id);
  let out = html.replace(
    new RegExp(`<p[^>]*>\\s*(?:<(?:span|strong|b|em|i)[^>]*>){0,3}\\s*\\[\\[TABLE:${idEsc}\\]\\]\\s*(?:<\\/(?:span|strong|b|em|i)>){0,3}\\s*<\\/p>`, "g"),
    () => tableHtml
  );
  out = out.replace(
    new RegExp(`(?:<(?:span|strong|b|em|i)[^>]*>){0,3}\\s*\\[\\[TABLE:${idEsc}\\]\\]\\s*(?:<\\/(?:span|strong|b|em|i)>){0,3}`, "g"),
    () => tableHtml
  );
  out = out.split(`[[TABLE:${id}]]`).join(tableHtml);
  return out;
};

const extractTablesFromContent = (content: string): { displayContent: string; tables: TableEntry[] } => {
  if (!content) return { displayContent: "", tables: [] };
  let working = content;
  const tables: TableEntry[] = [];

  const blockRegex = /<!--TABLES:([\s\S]*?):TABLES-->/;
  const blockMatch = working.match(blockRegex);
  if (blockMatch) {
    try {
      const parsed = JSON.parse(blockMatch[1]) as TableEntry[];
      if (Array.isArray(parsed)) tables.push(...parsed);
    } catch { /* ignore */ }
    working = working.replace(blockRegex, "");
  }

  tables.forEach((t) => {
    if (t.html && working.includes(t.html)) {
      const pos = working.indexOf(t.html);
      working = working.slice(0, pos) + styledMarker(t.id) + working.slice(pos + t.html.length);
    }
  });

  tables.forEach((t) => {
    working = working.split(`[[TABLE:${t.id}]]`).join(styledMarker(t.id));
  });

  const inline = working.match(/<div class="table-wrapper">[\s\S]*?<\/table><\/div>/g) || [];
  inline.forEach((tbl, i) => {
    const id = `TBL_OLD${Date.now()}${i}`;
    tables.push({ id, html: tbl });
    working = working.split(tbl).join(styledMarker(id));
  });

  working = working.replace(/(?:<p>\s*<\/p>\s*)+$/g, "");
  return { displayContent: working, tables };
};

const buildFinalContent = (text: string, tables: TableEntry[]): string => {
  let out = text || "";
  if (tables && tables.length > 0) {
    const used = new Set<string>();
    tables.forEach((t) => {
      if (out.includes(`[[TABLE:${t.id}]]`)) {
        out = replaceMarkerWithHtml(out, t.id, t.html);
        used.add(t.id);
      }
    });
    out += tables.filter((t) => !used.has(t.id)).map((t) => t.html).join("");
    out = out.replace(
      /(?:<(?:span|strong|b|em|i)[^>]*>){0,3}\s*\[\[TABLE:[A-Za-z0-9_]+\]\]\s*(?:<\/(?:span|strong|b|em|i)>){0,3}/g,
      ""
    );
    return out + `<!--TABLES:${JSON.stringify(tables)}:TABLES-->`;
  }
  return out.replace(
    /(?:<(?:span|strong|b|em|i)[^>]*>){0,3}\s*\[\[TABLE:[A-Za-z0-9_]+\]\]\s*(?:<\/(?:span|strong|b|em|i)>){0,3}/g,
    ""
  );
};

/* ============================================================
   QUILL CONFIG
============================================================ */

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link", "image", "video"],
    ["clean"],
  ],
};

const quillFormats = [
  "header", "size", "bold", "italic", "underline", "strike", "color", "background",
  "script", "list", "bullet", "indent", "align", "blockquote", "code-block",
  "link", "image", "video",
];

const contentParts = Array.from({ length: 10 }, (_, i) => ({
  key: String(i + 1),
  label: `P${i + 1}`,
  optional: i >= 3,
}));

/* ============================================================
   BLOG FORM — parent props: catList, subCatList, editing,
   onCancelEdit, onSaved | ✅ Day/Night theme support
============================================================ */

export default function BlogForm({
  catList = [],
  subCatList = [],
  editing = null,
  onCancelEdit,
  onSaved,
}: {
  catList?: any[];
  subCatList?: any[];
  editing?: any;
  onCancelEdit?: () => void;
  onSaved?: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(editing?._id ?? null);
  const [activePart, setActivePart] = useState("1");

  const [blogTitle, setBlogTitle] = useState("");
  const [blogCategory, setBlogCategory] = useState("");
  const [blogSubCategory, setBlogSubCategory] = useState("");
  const [blogDesc, setBlogDesc] = useState("");
  const [blogHeroVideo, setBlogHeroVideo] = useState("");
  const [blogWriterName, setBlogWriterName] = useState("");
  const [blogWriterSocial, setBlogWriterSocial] = useState("");

  const [blogContents, setBlogContents] = useState<string[]>(Array(10).fill(""));
  const [blogImages, setBlogImages] = useState<ImageState[]>(Array(10).fill({ url: "", assetId: "" }));
  const [imgOrientations, setImgOrientations] = useState<Record<string, string>>({});

  const [blogFeatured, setBlogFeatured] = useState(false);
  const [blogPublished, setBlogPublished] = useState(false);
  const [blogSeoTitle, setBlogSeoTitle] = useState("");
  const [blogSeoDesc, setBlogSeoDesc] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [savingBlog, setSavingBlog] = useState(false);

  /* ---------- TABLE states ---------- */
  const [partTables, setPartTables] = useState<Record<string, TableEntry[]>>({});
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableData, setTableData] = useState<string[][]>(
    Array.from({ length: 3 }, () => Array(3).fill(""))
  );
  const [tableFirstRowHeader, setTableFirstRowHeader] = useState(true);

  /* ---------- AI MARKDOWN state ---------- */
  const [showMdModal, setShowMdModal] = useState(false);
  const [mdInput, setMdInput] = useState("");

  /* ---------- Inline add category/sub ---------- */
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isAddingSubCat, setIsAddingSubCat] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState("");

  const quillRef = useRef<any>(null);
  const cursorIndexRef = useRef<Record<string, number | null>>({});

  const selectedCat = catList.find((c) => getSlug(c.slug) === blogCategory);
  const availableSubCats = selectedCat ? subCatList.filter((s) => s.parentId === selectedCat._id) : [];
  const selectedSubCat = availableSubCats.find((s) => getSlug(s.slug) === blogSubCategory);

  /* ======== PREFILL / RESET ======== */
  useEffect(() => {
    if (editing) {
      setEditingId(editing._id);
      setBlogTitle(editing.title || "");
      setBlogDesc(editing.desc || "");
      setBlogHeroVideo(editing.heroVideoUrl || "");
      setBlogWriterName(editing.writerName || "");
      setBlogWriterSocial(editing.writerSocial || "");
      setBlogFeatured(!!editing.isFeatured);
      setBlogPublished(!!editing.isPublished);
      setImgOrientations(editing.imgOrientations || {});
      setBlogSeoTitle(editing.seoTitle || "");
      setBlogSeoDesc(editing.seoDesc || "");
      setBlogKeywords(editing.keywords || "");

      const catOf = (v: any, list: any[]) => {
        if (!v) return "";
        if (typeof v === "string") return v;
        if (v.slug) return getSlug(v.slug);
        if (v._ref) return getSlug(list.find((x: any) => x._id === v._ref)?.slug);
        return "";
      };
      setBlogCategory(catOf(editing.category, catList));
      setBlogSubCategory(catOf(editing.subCategory, subCatList));

      const contents = Array(10).fill("");
      const images: ImageState[] = Array(10).fill({ url: "", assetId: "" });
      const allTables: Record<string, TableEntry[]> = {};

      for (let i = 0; i < 10; i++) {
        const raw = editing[`content${i + 1}`] ?? "";
        const { displayContent, tables } = extractTablesFromContent(raw);
        contents[i] = displayContent;
        if (tables.length > 0) allTables[String(i + 1)] = tables;
        images[i] = { url: editing[`img${i + 1}Url`] || "", assetId: "" };
      }

      setBlogContents(contents);
      setBlogImages(images);
      setPartTables(allTables);
    } else {
      setEditingId(null);
      setBlogTitle("");
      setBlogCategory(catList.length > 0 ? getSlug(catList[0].slug) : "");
      setBlogSubCategory("");
      setBlogDesc("");
      setBlogHeroVideo("");
      setBlogWriterName("");
      setBlogWriterSocial("");
      setBlogContents(Array(10).fill(""));
      setBlogImages(Array(10).fill({ url: "", assetId: "" }));
      setBlogFeatured(false);
      setBlogPublished(false);
      setImgOrientations({});
      setBlogSeoTitle("");
      setBlogSeoDesc("");
      setBlogKeywords("");
      setPartTables({});
    }

    setActivePart("1");
    setIsAddingCat(false);
    setIsAddingSubCat(false);
    setShowTableModal(false);
    setShowMdModal(false);
    setMdInput("");
    cursorIndexRef.current = {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const switchPart = (key: string) => setActivePart(key);

  const setOrientation = (key: string, val: string) =>
    setImgOrientations((prev) => ({ ...prev, [key]: val }));

  /* ======== WATERMARK ======== */
  const addWatermark = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0);

          const logo = new Image();
          logo.onerror = () => {
            console.warn("⚠️ /logo.png nahi mila — bina watermark upload ho raha hai.");
            resolve(file);
          };
          logo.onload = () => {
            const logoWidth = canvas.width * 0.15;
            const logoHeight = (logo.height / logo.width) * logoWidth;
            const padding = 20;
            ctx.globalAlpha = 0.85;
            ctx.drawImage(logo, canvas.width - logoWidth - padding, padding, logoWidth, logoHeight);

            canvas.toBlob((blob) => {
              if (blob) resolve(new File([blob], file.name, { type: file.type }));
              else resolve(file);
            }, file.type);
          };
          logo.src = LOGO_URL;
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: any, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const watermarked = await addWatermark(file);
      const assetId = await apiUploadImage(watermarked);
      setBlogImages((prev) => {
        const n = [...prev];
        n[index] = { url: URL.createObjectURL(watermarked), assetId };
        return n;
      });
    } catch (err: any) {
      alert(err?.message || "Upload failed");
    }
  };

  const handleCategoryChange = (slug: string) => {
    setBlogCategory(slug);
    setBlogSubCategory("");
    setIsAddingSubCat(false);
  };

  const handleContentChange = (index: number, value: string) => {
    setBlogContents((prev) => {
      const n = [...prev];
      n[index] = value;
      return n;
    });
  };

  /* ======== ADD CATEGORY / SUBCATEGORY ======== */
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return alert("Category ka naam likho!");
    try {
      await apiAddCategory(newCatName.trim(), slugify(newCatName));
      setIsAddingCat(false);
      setNewCatName("");
      onSaved?.();
      alert("Category add ho gayi!");
    } catch (e: any) {
      alert(e?.message || "Error");
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCatName.trim()) return alert("Sub-category ka naam likho!");
    if (!selectedCat) return alert("Pehle main category select karo!");
    try {
      await apiAddSubCategory(newSubCatName.trim(), slugify(newSubCatName), selectedCat._id);
      setIsAddingSubCat(false);
      setBlogSubCategory(slugify(newSubCatName));
      setNewSubCatName("");
      onSaved?.();
      alert("Sub-category add ho gayi!");
    } catch (e: any) {
      alert(e?.message || "Error");
    }
  };

  /* ======== INSERT HELPERS (robust retry) ======== */
  const insertHtml = (html: string) => {
    const tryInsert = (attempt = 0) => {
      const editor = quillRef.current?.getEditor?.();

      if (!editor) {
        if (attempt < 10) {
          setTimeout(() => tryInsert(attempt + 1), 500);
          return;
        }
        alert("Editor load nahi hua — page refresh karke dobara try karo.");
        return;
      }

      const range = editor.getSelection(true);
      const index = range?.index ?? editor.getLength();
      editor.clipboard.dangerouslyPasteHTML(index, html, "user");
      editor.setSelection(index + 1, 0, "user");
    };
    tryInsert();
  };

  const insertTableMarker = (tableId: string) => {
    const marker = `[[TABLE:${tableId}]]`;
    const editor = quillRef.current?.getEditor?.();

    if (editor) {
      try {
        const saved = cursorIndexRef.current[activePart];
        const len = editor.getLength();
        let index = typeof saved === "number" ? Math.min(saved, len) : len;

        const text = editor.getText();
        if (index > 0 && text[index - 1] !== "\n") {
          editor.insertText(index, "\n", "user");
          index += 1;
        }
        editor.insertText(index, marker, "user");

        editor.formatText(index, marker.length, {
          background: "#FEF3C7",
          color: "#92400E",
          bold: true,
        }, "user");

        const after = editor.getText(index + marker.length, 1);
        if (after && after !== "\n") editor.insertText(index + marker.length, "\n", "user");

        const newCursor = Math.min(index + marker.length + 1, editor.getLength());
        editor.setSelection(newCursor, 0);
        cursorIndexRef.current[activePart] = newCursor;
        return;
      } catch { /* fallback */ }
    }

    const idx = parseInt(activePart) - 1;
    handleContentChange(idx, `${blogContents[idx] || ""}<p>${styledMarker(tableId)}</p>`);
  };

  const removeMarkerFromContent = (tableId: string) => {
    const idx = parseInt(activePart) - 1;
    handleContentChange(idx, stripMarker(blogContents[idx] || "", tableId));
  };

  /* ======== TABLE BUILDER ======== */
  const openTableModal = () => {
    setTableData((prev) =>
      Array.from({ length: tableRows }, (_, r) =>
        Array.from({ length: tableCols }, (_, c) => prev[r]?.[c] || "")
      )
    );
    setShowTableModal(true);
  };

  const resizeTableGrid = (rows: number, cols: number) => {
    setTableRows(rows);
    setTableCols(cols);
    setTableData((prev) =>
      Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => prev[r]?.[c] || "")
      )
    );
  };

  const buildTableHtml = (rows: string[][], header: boolean): string => {
    const TH = "border:1px solid #d1d5db; padding:8px 10px; background:#F5A623; color:#0A1929; font-weight:bold; text-align:left;";
    const TD = "border:1px solid #d1d5db; padding:8px 10px; text-align:left;";
    let html = '<div class="table-wrapper"><table border="1" style="border-collapse:collapse; width:100%;">';
    rows.forEach((row, r) => {
      html += "<tr>";
      row.forEach((cell) => {
        html += r === 0 && header
          ? `<th style="${TH}">${cell || " "}</th>`
          : `<td style="${TD}">${cell || " "}</td>`;
      });
      html += "</tr>";
    });
    html += "</table></div>";
    return html;
  };

  const handleInsertTable = () => {
    const hasData = tableData.some((row) => row.some((cell) => cell.trim() !== ""));
    if (!hasData) return alert("Kam az kam ek cell bharo!");

    const html = buildTableHtml(tableData, tableFirstRowHeader);
    const id = `TBL${Date.now()}`;

    setPartTables((prev) => ({
      ...prev,
      [activePart]: [...(prev[activePart] || []), { id, html }],
    }));

    setShowTableModal(false);
    setTimeout(() => insertTableMarker(id), 50);
    alert(`✅ Table add ho gayi! Editor me YELLOW highlight [[TABLE:...]] marker dekho — wahi table ki jagah hai. Marker ke upar/neeche dono taraf text likh sakte ho. Marker line cut-paste karke table kahin bhi shift kar sakte ho.`);
  };

  const removeTable = (partKey: string, tableId: string) => {
    const idx = parseInt(partKey) - 1;
    const cur = blogContents[idx] || "";
    if (cur.includes(`[[TABLE:${tableId}]]`)) {
      handleContentChange(idx, stripMarker(cur, tableId));
    }
    setPartTables((prev) => ({
      ...prev,
      [partKey]: (prev[partKey] || []).filter((t) => t.id !== tableId),
    }));
  };

  /* ============================================================
     🤖 AI MARKDOWN → HTML
  ============================================================ */
  const mdInline = (s: string): string =>
    s
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      .replace(/`([^`]+)`/g, '<code style="background:rgba(128,128,128,0.15);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#F5A623;text-decoration:underline;">$1</a>');

  const convertMarkdown = (md: string): { html: string; tables: TableEntry[] } => {
    const tables: TableEntry[] = [];
    const TH = "border:1px solid #d1d5db; padding:8px 10px; background:#F5A623; color:#0A1929; font-weight:bold; text-align:left;";
    const TD = "border:1px solid #d1d5db; padding:8px 10px; text-align:left;";

    const lines = md.replace(/\r/g, "").split("\n");
    const out: string[] = [];
    let i = 0;
    const isSep = (l: string) => l.includes("-") && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l);

    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) { i++; continue; }

      if (t.includes("|") && i + 1 < lines.length && isSep(lines[i + 1])) {
        const parseRow = (l: string) =>
          l.trim().replace(/^\||\|$/g, "").split("|").map((c) => mdInline(c.trim()));
        const head = parseRow(t);
        i += 2;
        const body: string[][] = [];
        while (i < lines.length && lines[i].trim().includes("|")) {
          body.push(parseRow(lines[i]));
          i++;
        }
        const id = `TBL${Date.now()}${tables.length}`;
        let tbl = '<div class="table-wrapper"><table border="1" style="border-collapse:collapse; width:100%;">';
        tbl += "<tr>" + head.map((c) => `<th style="${TH}">${c}</th>`).join("") + "</tr>";
        body.forEach((row) => {
          tbl += "<tr>" + head.map((_, ci) => `<td style="${TD}">${row[ci] ?? " "}</td>`).join("") + "</tr>";
        });
        tbl += "</table></div>";
        tables.push({ id, html: tbl });
        out.push(`<p><span style="${MARKER_STYLE}"><strong>[[TABLE:${id}]]</strong></span></p>`);
        continue;
      }

      const h = t.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const lvl = Math.min(h[1].length, 3);
        out.push(`<h${lvl}>${mdInline(h[2])}</h${lvl}>`);
        i++;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { out.push("<hr/>"); i++; continue; }

      if (t.startsWith("```")) {
        const buf: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) { buf.push(lines[i]); i++; }
        i++;
        out.push(`<pre style="background:rgba(128,128,128,0.12);padding:12px;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:13px;">${buf.join("\n")}</pre>`);
        continue;
      }

      if (t.startsWith(">")) {
        const buf: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          buf.push(lines[i].trim().replace(/^>\s?/, ""));
          i++;
        }
        out.push(`<blockquote style="border-left:4px solid #F5A623;margin:12px 0;padding:8px 16px;background:rgba(128,128,128,0.08);">${mdInline(buf.join(" "))}</blockquote>`);
        continue;
      }

      if (/^\d+[.)]\s+/.test(t)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          items.push(`<li>${mdInline(lines[i].trim().replace(/^\d+[.)]\s+/, ""))}</li>`);
          i++;
        }
        out.push(`<ol style="margin:8px 0;padding-left:24px;">${items.join("")}</ol>`);
        continue;
      }

      if (/^[-*+]\s+/.test(t)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          let item = lines[i].trim().replace(/^[-*+]\s+/, "");
          item = item.replace(/^\[( |x|X)\]\s*/, (_m: string, c: string) => (c.toLowerCase() === "x" ? "✅ " : "⬜ "));
          items.push(`<li>${mdInline(item)}</li>`);
          i++;
        }
        out.push(`<ul style="margin:8px 0;padding-left:24px;">${items.join("")}</ul>`);
        continue;
      }

      const buf: string[] = [t];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,6}\s|>|\||[-*+]\s|\d+[.)]\s|```)/.test(lines[i].trim()) &&
        !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
      ) {
        buf.push(lines[i].trim());
        i++;
      }
      out.push(`<p style="margin:8px 0;">${mdInline(buf.join(" "))}</p>`);
    }
    return { html: out.join(""), tables };
  };

  const handleConvertMarkdown = () => {
    if (!mdInput.trim()) return alert("Pehle ChatGPT/Claude ka markdown paste karo!");

    const { html, tables } = convertMarkdown(mdInput);
    if (!html && !tables.length) return alert("Convert karne ke liye kuch nahi mila!");

    setPartTables((prev) => ({
      ...prev,
      [activePart]: [...(prev[activePart] || []), ...tables],
    }));

    setShowMdModal(false);
    setMdInput("");
    setTimeout(() => insertHtml(html + "<p><br/></p>"), 50);
    if (tables.length > 0) {
      alert(`✅ ${tables.length} table(s) + content add ho gaya! Editor me YELLOW markers dekho — wahan tables render hongi.`);
    }
  };

  /* ======== SAVE PART ======== */
  const handleSavePart = async () => {
    if (!editingId) return alert("Pehle neeche Publish/Update se blog save karo, phir individual part save hoga.");

    const partIndex = parseInt(activePart) - 1;
    const tables = partTables[activePart] || [];

    const patch: any = {
      [`content${activePart}`]: buildFinalContent(blogContents[partIndex], tables),
      imgOrientations,
    };

    const img = blogImages[partIndex];
    if (img.assetId) {
      patch[`img${activePart}`] = { _type: "image", asset: { _ref: img.assetId, _type: "reference" } } as SanityImageRef;
    } else if (!img.url) {
      patch[`img${activePart}`] = null;
    }

    try {
      await apiUpdateBlog(editingId, patch);
      alert(`✅ Part ${activePart} saved! (Text + ${tables.length} table(s))`);
      onSaved?.();
    } catch (e: any) {
      alert("Error saving part: " + (e?.message || "unknown"));
    }
  };

  /* ======== SAVE / PUBLISH BLOG ======== */
  const handleSaveBlog = async () => {
    if (!blogTitle.trim()) return alert("Title required!");

    setSavingBlog(true);
    try {
      if (editingId) {
        const patch: any = {
          title: blogTitle,
          desc: blogDesc,
          category: selectedCat ? { _type: "reference", _ref: selectedCat._id } : undefined,
          subCategory: selectedSubCat ? { _type: "reference", _ref: selectedSubCat._id } : undefined,
          isFeatured: blogFeatured,
          isPublished: blogPublished,
          seoTitle: blogSeoTitle || undefined,
          seoDesc: blogSeoDesc || undefined,
          keywords: blogKeywords || undefined,
          writerName: blogWriterName || undefined,
          writerSocial: blogWriterSocial || undefined,
          heroVideoUrl: blogHeroVideo || undefined,
          imgOrientations,
        };

        for (let i = 0; i < 10; i++) {
          patch[`content${i + 1}`] = buildFinalContent(blogContents[i], partTables[String(i + 1)] || []);
          const img = blogImages[i];
          if (img.assetId) {
            patch[`img${i + 1}`] = { _type: "image", asset: { _ref: img.assetId, _type: "reference" } } as SanityImageRef;
          } else if (!img.url) {
            patch[`img${i + 1}`] = null;
          }
        }

        await apiUpdateBlog(editingId, patch);
        alert("Blog Updated! (URL unchanged — backlinks safe)");
        onSaved?.();
      } else {
        const doc: any = {
          _type: "blog",
          title: blogTitle,
          slug: { _type: "slug", current: slugify(blogTitle) },
          desc: blogDesc,
          category: selectedCat ? { _type: "reference", _ref: selectedCat._id } : undefined,
          subCategory: selectedSubCat ? { _type: "reference", _ref: selectedSubCat._id } : undefined,
          isFeatured: blogFeatured,
          isPublished: blogPublished,
          seoTitle: blogSeoTitle || undefined,
          seoDesc: blogSeoDesc || undefined,
          keywords: blogKeywords || undefined,
          writerName: blogWriterName || undefined,
          writerSocial: blogWriterSocial || undefined,
          heroVideoUrl: blogHeroVideo || undefined,
          imgOrientations,
          date: new Date().toISOString(),
        };

        for (let i = 0; i < 10; i++) {
          doc[`content${i + 1}`] = buildFinalContent(blogContents[i], partTables[String(i + 1)] || []) || undefined;
          if (blogImages[i].assetId) {
            doc[`img${i + 1}`] = { _type: "image", asset: { _ref: blogImages[i].assetId, _type: "reference" } } as SanityImageRef;
          }
        }

        await apiSaveBlog(doc);
        alert("Blog Post Saved! 🎉");
        onSaved?.();
      }
    } catch (e: any) {
      alert("Error: " + (e?.message || "unknown"));
    }
    setSavingBlog(false);
  };

  /* ======== PDF DOWNLOAD ======== */
  const handleDownloadPDF = async () => {
    if (!blogTitle) return alert("PDF ke liye pehle Blog Title likho!");

    const printContainer = document.createElement("div");
    printContainer.style.position = "absolute";
    printContainer.style.left = "-9999px";
    printContainer.style.top = "0";
    printContainer.style.width = "800px";
    printContainer.style.padding = "40px";
    printContainer.style.backgroundColor = "#ffffff";
    printContainer.style.fontFamily = "Arial, sans-serif";
    printContainer.style.color = "#000000";

    const titleEl = document.createElement("h1");
    titleEl.innerText = blogTitle;
    titleEl.style.fontSize = "28px";
    titleEl.style.marginBottom = "20px";
    printContainer.appendChild(titleEl);

    for (let i = 0; i < 10; i++) {
      if (blogContents[i] || (partTables[String(i + 1)]?.length || 0) > 0) {
        const contentEl = document.createElement("div");
        contentEl.innerHTML = buildFinalContent(blogContents[i], partTables[String(i + 1)] || []);
        contentEl.style.marginBottom = "20px";
        printContainer.appendChild(contentEl);
      }
      if (blogImages[i]?.url) {
        const imgEl = document.createElement("img");
        imgEl.src = blogImages[i].url;
        imgEl.style.maxWidth = "100%";
        imgEl.style.marginBottom = "20px";
        imgEl.crossOrigin = "anonymous";
        printContainer.appendChild(imgEl);
      }
    }

    document.body.appendChild(printContainer);

    const images = printContainer.getElementsByTagName("img");
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    await Promise.all(imagePromises);

    try {
      const canvas = await html2canvas(printContainer, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(slugify(blogTitle) + ".pdf");
    } catch (error) {
      console.error("PDF Error:", error);
      alert("PDF generate nahi hua — console check karo.");
    } finally {
      document.body.removeChild(printContainer);
    }
  };

  const currentPartIndex = parseInt(activePart) - 1;
  const currentPartTables = partTables[activePart] || [];

  /* ======== ✅ THEME-AWARE CLASSES ======== */
  const inputCls =
    "w-full px-4 py-3 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition-all";
  const panelCls = "bg-white dark:bg-[#0D1F30] border-gray-200 dark:border-[#1E3A52]";
  const subPanelCls = "bg-gray-50/70 dark:bg-[#13293D]/40 border-gray-200 dark:border-[#1E3A52]";
  const mutedText = "text-gray-500 dark:text-gray-400";

  return (
    <div className={`rounded-2xl border ${panelCls} p-4 md:p-6 shadow-lg space-y-4`}>

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            {editingId ? "✏️ Edit Blog" : "✍️ Create New Blog"}
          </h2>
          {editingId && (
            <p className="text-[10px] text-[#F5A623] mt-0.5">🔒 URL locked — backlinks safe</p>
          )}
        </div>
        <button
          onClick={() => onCancelEdit?.()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#13293D] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1E3A52] hover:text-gray-900 dark:hover:text-white transition-all text-sm"
        >✕</button>
      </div>

      {/* TITLE + SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input type="text" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} placeholder="Blog Title *" className={inputCls} />
        <input type="text" value={blogDesc} onChange={(e) => setBlogDesc(e.target.value)} placeholder="Short Summary" className={inputCls} />
      </div>

      {/* HERO VIDEO */}
      <div className="border border-[#F5A623]/30 bg-[#F5A623]/5 rounded-xl p-3">
        <label className="block text-[10px] font-bold text-[#F5A623] uppercase tracking-wider mb-1.5">🎬 Hero Video URL (Optional)</label>
        <input
          type="url"
          value={blogHeroVideo}
          onChange={(e) => setBlogHeroVideo(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#13293D] border border-[#F5A623]/30 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-[#F5A623] transition-all"
        />
      </div>

      {/* CATEGORY + SUBCATEGORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          {!isAddingCat ? (
            <select value={blogCategory} onChange={(e) => handleCategoryChange(e.target.value)} className={`${inputCls} cursor-pointer`}>
              <option value="">-- Select Category --</option>
              {catList.map((c: any) => (
                <option key={c._id} value={getSlug(c.slug)}>{c.title}</option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="New Category Name" className={inputCls} />
              <button type="button" onClick={handleAddCategory} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold whitespace-nowrap">Save</button>
              <button type="button" onClick={() => setIsAddingCat(false)} className="px-3 py-2 border border-gray-200 dark:border-[#1E3A52] text-gray-500 dark:text-gray-400 rounded-lg text-sm">✕</button>
            </div>
          )}
          <button type="button" onClick={() => setIsAddingCat(!isAddingCat)}
            className="text-[11px] font-semibold text-[#F5A623] w-fit hover:underline">
            {isAddingCat ? "← Back to Select" : "+ Add New Category"}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {!isAddingSubCat ? (
            <select value={blogSubCategory} onChange={(e) => setBlogSubCategory(e.target.value)}
              disabled={!selectedCat || availableSubCats.length === 0}
              className={`${inputCls} cursor-pointer disabled:opacity-50`}>
              <option value="">-- Sub-Category --</option>
              {availableSubCats.map((s: any) => (
                <option key={s._id} value={getSlug(s.slug)}>{s.title}</option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input type="text" value={newSubCatName} onChange={(e) => setNewSubCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubCategory()}
                placeholder="Enter New Sub-Category" className={inputCls} />
              <button type="button" onClick={handleAddSubCategory} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold whitespace-nowrap">Save</button>
              <button type="button" onClick={() => setIsAddingSubCat(false)} className="px-3 py-2 border border-gray-200 dark:border-[#1E3A52] text-gray-500 dark:text-gray-400 rounded-lg text-sm">✕</button>
            </div>
          )}
          <button type="button" onClick={() => { setIsAddingSubCat(!isAddingSubCat); setNewSubCatName(""); }}
            disabled={!selectedCat}
            className={`text-[11px] font-semibold w-fit hover:underline disabled:opacity-50 ${isAddingSubCat ? "text-gray-500" : "text-[#F5A623]"}`}>
            {isAddingSubCat ? "← Back to Select" : "+ Add New Sub-Category"}
          </button>
        </div>
      </div>

      {/* WRITER DETAILS */}
      <div className={`border ${subPanelCls} rounded-xl p-4`}>
        <h3 className={`text-[10px] font-bold ${mutedText} uppercase tracking-wider mb-3`}>✍️ Writer / Author Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="text" value={blogWriterName} onChange={(e) => setBlogWriterName(e.target.value)} placeholder="Writer Name (e.g. Ahmed Ali)" className={inputCls} />
          <input type="url" value={blogWriterSocial} onChange={(e) => setBlogWriterSocial(e.target.value)} placeholder="Social Link (https://...)" className={inputCls} />
        </div>
      </div>

      {/* STATUS TOGGLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${blogPublished ? "bg-green-50 dark:bg-green-500/10 border-green-300 dark:border-green-500/30" : `${subPanelCls}`}`}>
          <div>
            <p className={`text-sm font-medium ${blogPublished ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>{blogPublished ? "🟢 Published" : "🟡 Draft"}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Toggle to change status</p>
          </div>
          <button type="button" onClick={() => setBlogPublished(!blogPublished)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${blogPublished ? "bg-green-500" : "bg-gray-300 dark:bg-[#1E3A52]"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${blogPublished ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${blogFeatured ? "bg-[#F5A623]/10 border-[#F5A623]/30" : `${subPanelCls}`}`}>
          <div>
            <p className={`text-sm font-medium ${blogFeatured ? "text-[#F5A623]" : "text-gray-900 dark:text-white"}`}>⭐ Featured Article</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Show on homepage</p>
          </div>
          <button type="button" onClick={() => setBlogFeatured(!blogFeatured)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${blogFeatured ? "bg-[#F5A623]" : "bg-gray-300 dark:bg-[#1E3A52]"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${blogFeatured ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {/* ================= CONTENT PARTS (P1–P10) ================= */}
      <div className={`border ${panelCls} rounded-xl overflow-hidden`}>
        <div className="flex overflow-x-auto bg-gray-50 dark:bg-[#13293D]/60 border-b border-gray-200 dark:border-[#1E3A52] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {contentParts.map((p) => {
            const idx = parseInt(p.key) - 1;
            const filled = blogContents[idx]?.replace(/<[^>]*>/g, "").trim();
            return (
              <button key={p.key} onClick={() => switchPart(p.key)}
                className={`flex-shrink-0 px-3.5 py-2 text-[11px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activePart === p.key
                    ? "bg-white dark:bg-[#0D1F30] text-[#F5A623] border-[#F5A623]"
                    : filled
                    ? "text-gray-700 dark:text-gray-300 border-green-400"
                    : "text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300"
                }`}>
                {filled ? "● " : ""}{p.label}{p.optional && <span className="text-gray-300 ml-0.5">·</span>}
              </button>
            );
          })}
        </div>

        <div className="p-4 space-y-4">
          {/* LEGEND */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap">
            <span className="px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>&nbsp;[[TABLE:...]]&nbsp;</span>
            <span>= editor me <strong>YELLOW marker</strong> wahin table render hogi. Upar/neeche dono taraf text likho.</span>
          </div>

          {/* EDITOR */}
          <div className="border border-gray-200 dark:border-[#1E3A52] rounded-xl overflow-hidden bg-white dark:bg-[#0A1929] flex flex-col" style={{ minHeight: "400px" }}>
            <ReactQuill
              key={activePart}
              ref={(el: any) => {
                if (el?.getEditor) quillRef.current = el;
                else quillRef.current = null;
              }}
              theme="snow"
              value={blogContents[currentPartIndex]}
              onChange={(val: string) => handleContentChange(currentPartIndex, sanitizeQuill(val))}
              onChangeSelection={(range: any) => {
                if (range && typeof range.index === "number") {
                  cursorIndexRef.current[activePart] = range.index;
                }
              }}
              modules={quillModules}
              formats={quillFormats}
              className="flex-1 text-gray-900 dark:text-white"
              style={{ minHeight: "350px" }}
            />
          </div>

          {/* TABLE SECTION */}
          <div className={`border ${subPanelCls} rounded-xl p-3.5`}>
            <h3 className={`text-[10px] font-bold ${mutedText} uppercase tracking-wider mb-2`}>📊 Tables for Part {activePart}</h3>

            {currentPartTables.length > 0 && (
              <div className="space-y-2 mb-3">
                {currentPartTables.map((t, idx) => {
                  const positioned = (blogContents[currentPartIndex] || "").includes(`[[TABLE:${t.id}]]`);
                  return (
                    <div key={t.id} className="flex items-center justify-between bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-lg px-3 py-2 flex-wrap gap-2">
                      <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                        📊 Table {idx + 1} — {positioned ? "🟡 Text ke beech" : "⬇️ End me add hogi"}
                      </span>
                      <div className="flex items-center gap-3">
                        {positioned ? (
                          <button type="button" onClick={() => removeMarkerFromContent(t.id)} className="text-gray-500 dark:text-gray-400 text-xs font-semibold hover:text-gray-700 dark:hover:text-white">⬇️ End me le jao</button>
                        ) : (
                          <button type="button" onClick={() => insertTableMarker(t.id)} className="text-[#F5A623] text-xs font-semibold hover:underline">🟡 Editor me marker daalo</button>
                        )}
                        <button type="button" onClick={() => removeTable(activePart, t.id)} className="text-red-500 text-xs font-semibold hover:text-red-700">✕ Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${mutedText}`}>Rows:</span>
                <input type="number" min={2} max={15} value={tableRows}
                  onChange={(e) => resizeTableGrid(Math.max(2, Math.min(15, parseInt(e.target.value) || 2)), tableCols)}
                  className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-[#F5A623]" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${mutedText}`}>Columns:</span>
                <input type="number" min={2} max={8} value={tableCols}
                  onChange={(e) => resizeTableGrid(tableRows, Math.max(2, Math.min(8, parseInt(e.target.value) || 2)))}
                  className="w-16 px-2 py-1.5 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-[#F5A623]" />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={tableFirstRowHeader} onChange={(e) => setTableFirstRowHeader(e.target.checked)} />
                First row = header
              </label>
              <button type="button" onClick={openTableModal}
                className="px-4 py-2 bg-[#F5A623] text-[#0A1929] rounded-lg text-xs font-bold hover:bg-[#FFB94D] transition-colors">
                📝 New Table
              </button>
              <button type="button" onClick={() => setShowMdModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                🤖 Paste from AI (Markdown)
              </button>
            </div>
          </div>

          {/* WORD COUNTS */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
            <span>Part {activePart} · <strong className="text-gray-600 dark:text-gray-300">{getWordCount(blogContents[currentPartIndex])} words</strong> · {currentPartTables.length} table(s)</span>
            <span>Total: <strong className="text-gray-600 dark:text-gray-300">{blogContents.reduce((s, c) => s + getWordCount(c), 0)} words</strong></span>
          </div>

          {/* IMAGE UPLOAD + ORIENTATION */}
          <div className="border border-dashed border-gray-300 dark:border-[#1E3A52] rounded-xl p-4 hover:border-[#F5A623]/50 transition-colors">
            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">📷 Upload Image {activePart} (Auto Watermark)</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, currentPartIndex)}
              className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F5A623]/10 file:text-[#F5A623] hover:file:bg-[#F5A623]/20 file:cursor-pointer" />

            {blogImages[currentPartIndex]?.url && (
              <div className="mt-4 space-y-3">
                <div className="relative group w-fit">
                  <img
                    src={blogImages[currentPartIndex].url}
                    alt=""
                    className={`rounded-lg object-cover border border-gray-200 dark:border-[#1E3A52] ${
                      imgOrientations[activePart] === "vertical" ? "h-48 w-auto max-w-xs mx-auto" : "h-36 w-full"
                    }`}
                  />
                  <button type="button"
                    onClick={() => setBlogImages((prev) => { const n = [...prev]; n[currentPartIndex] = { url: "", assetId: "" }; return n; })}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Layout:</span>
                  <button type="button" onClick={() => setOrientation(activePart, "horizontal")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border-2 transition-all ${
                      (!imgOrientations[activePart] || imgOrientations[activePart] === "horizontal")
                        ? "border-[#F5A623] bg-[#F5A623]/10 text-[#F5A623]"
                        : "border-gray-200 dark:border-[#1E3A52] text-gray-400"
                    }`}>🔲 Horizontal</button>
                  <button type="button" onClick={() => setOrientation(activePart, "vertical")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border-2 transition-all ${
                      imgOrientations[activePart] === "vertical"
                        ? "border-[#F5A623] bg-[#F5A623]/10 text-[#F5A623]"
                        : "border-gray-200 dark:border-[#1E3A52] text-gray-400"
                    }`}>📱 Vertical</button>
                </div>
              </div>
            )}
          </div>

          {/* SAVE PART */}
          <button type="button" onClick={handleSavePart} disabled={!editingId}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
            💾 Save Part {activePart} Only
          </button>
        </div>
      </div>

      {/* SEO */}
      <div className={`p-4 ${subPanelCls} rounded-xl space-y-3`}>
        <p className={`text-[10px] font-bold ${mutedText} uppercase tracking-wide`}>SEO (Optional)</p>
        <div>
          <input type="text" value={blogSeoTitle} onChange={(e) => setBlogSeoTitle(e.target.value)}
            placeholder="SEO Title (Google mein jo dikhe)" maxLength={70} className={inputCls} />
          <p className={`text-[10px] text-right mt-0.5 ${blogSeoTitle.length > 60 ? "text-red-400" : "text-gray-400"}`}>{blogSeoTitle.length}/60</p>
        </div>
        <div>
          <textarea value={blogSeoDesc} onChange={(e) => setBlogSeoDesc(e.target.value)}
            placeholder="SEO Description (150-160 characters)" rows={2} maxLength={170}
            className={`${inputCls} resize-none`} />
          <p className={`text-[10px] text-right mt-0.5 ${blogSeoDesc.length > 160 ? "text-red-400" : "text-gray-400"}`}>{blogSeoDesc.length}/160</p>
        </div>
        <input type="text" value={blogKeywords} onChange={(e) => setBlogKeywords(e.target.value)}
          placeholder="Keywords (comma separated: engine, catalytic converter...)" className={inputCls} />
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button type="button" onClick={handleSaveBlog} disabled={savingBlog}
          className="bg-[#F5A623] hover:bg-[#FFB94D] disabled:opacity-50 text-[#0A1929] font-bold py-3 rounded-xl text-sm transition-colors">
          {savingBlog ? "Saving..." : editingId ? "Update Blog Post" : "🚀 Publish Blog Post"}
        </button>
        <button type="button" onClick={handleDownloadPDF}
          className="border-2 border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623] hover:text-[#0A1929] font-bold py-3 rounded-xl text-sm transition-colors">
          📄 Download PDF Preview
        </button>
      </div>

      {/* ================= TABLE MODAL ================= */}
      {showTableModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowTableModal(false)}>
          <div className={`w-full sm:max-w-lg ${panelCls} rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 max-h-[88vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">📝 Table Data Bharo ({tableRows}×{tableCols})</h3>
            <div className="overflow-x-auto">
              <table className="border-collapse w-full">
                <tbody>
                  {tableData.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} className="p-1">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => setTableData((prev) => prev.map((rw, ri) => ri === r ? rw.map((cl, ci) => ci === c ? e.target.value : cl) : rw))}
                            placeholder={r === 0 && tableFirstRowHeader ? `H${c + 1}` : `R${r + 1}C${c + 1}`}
                            className={`w-full min-w-[100px] px-2 py-1.5 border rounded text-xs outline-none focus:border-[#F5A623] ${
                              r === 0 && tableFirstRowHeader
                                ? "bg-[#F5A623]/10 border-[#F5A623]/40 text-gray-900 dark:text-white font-semibold"
                                : "bg-gray-50 dark:bg-[#13293D] border-gray-200 dark:border-[#1E3A52] text-gray-900 dark:text-white"
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleInsertTable}
                className="flex-1 bg-[#F5A623] text-[#0A1929] font-bold py-2.5 rounded-xl text-sm">✓ Insert into Part {activePart}</button>
              <button type="button" onClick={() => setShowTableModal(false)}
                className="px-4 border border-gray-200 dark:border-[#1E3A52] rounded-xl text-sm text-gray-500 dark:text-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= AI MARKDOWN MODAL ================= */}
      {showMdModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowMdModal(false)}>
          <div className={`w-full sm:max-w-2xl ${panelCls} rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">🤖 AI Markdown → Blog Content</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
              ChatGPT / Claude ka jawab paste karo — headings, bold, lists convert honge.
              <strong> Markdown tables ( | pipes ) YELLOW marker ke saath table banengi.</strong>
            </p>

            <textarea
              value={mdInput}
              onChange={(e) => setMdInput(e.target.value)}
              rows={10}
              placeholder={"# Meri Heading\n\nParagraph **bold** ke saath.\n\n| Part | Price |\n|---|---|\n| Engine | 50,000 |"}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#13293D] border border-gray-200 dark:border-[#1E3A52] rounded-xl text-xs text-gray-900 dark:text-white font-mono outline-none focus:border-[#F5A623]"
            />

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleConvertMarkdown}
                className="flex-1 bg-[#F5A623] text-[#0A1929] font-bold py-2.5 rounded-xl text-sm">✓ Convert & Insert into Part {activePart}</button>
              <button type="button" onClick={() => { setShowMdModal(false); setMdInput(""); }}
                className="px-4 border border-gray-200 dark:border-[#1E3A52] rounded-xl text-sm text-gray-500 dark:text-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}