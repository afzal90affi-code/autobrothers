/* ============================================================
   ADMIN API HELPERS
   Saare Sanity writes server-side API route se hote hain
   (token browser mein kabhi nahi jata — secure)
============================================================ */

/* ---------- CREATE ---------- */
export async function adminCreate(doc: any) {
  const res = await fetch("/api/admin/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doc }),
  });
  const r = await res.json();
  if (!r.success) throw new Error(r.error || "Save failed");
  return r.data;
}

/* ---------- DELETE ---------- */
export async function adminDelete(id: string) {
  const res = await fetch("/api/admin/create", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const r = await res.json();
  if (!r.success) throw new Error(r.error || "Delete failed");
  return r.data;
}

/* ---------- UPDATE (patch) ---------- */
export async function adminUpdate(id: string, patch: Record<string, any>) {
  const res = await fetch("/api/admin/create", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, patch }),
  });
  const r = await res.json();
  if (!r.success) throw new Error(r.error || "Update failed");
  return r.data;
}

/* ---------- IMAGE UPLOAD ---------- */
export async function adminUploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/create", { method: "PUT", body: fd });
  const r = await res.json();
  if (!r.success) throw new Error(r.error || "Upload failed");
  return r.assetId;
}