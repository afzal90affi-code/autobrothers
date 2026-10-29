/* IndexNow submit helper */

const KEY = process.env.INDEXNOW_KEY || "";
// FIX 1: trailing slash auto-hatao (warna host galat banta hai)
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

export async function submitToIndexNow(urls: string[]) {
  if (!KEY || !SITE || urls.length === 0) {
    return { ok: false, reason: "missing config" };
  }

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE.replace(/^https?:\/\//, ""),
        key: KEY,
        keyLocation: `${SITE}/${KEY}.txt`,
        // FIX 2: non-www URLs ko www pe force karo
        urlList: urls.map((u) => {
          const full = u.startsWith("http") ? u : `${SITE}${u}`;
          return full.replace("//autobrothers.pk", "//www.autobrothers.pk");
        }),
      }),
    });
    return { ok: res.ok || res.status === 202, status: res.status };
  } catch (err) {
    console.error("IndexNow submit failed:", err);
    return { ok: false, error: err };
  }
}