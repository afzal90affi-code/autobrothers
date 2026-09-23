/* IndexNow submit helper */

const KEY = process.env.INDEXNOW_KEY || "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";

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
        urlList: urls.map((u) => (u.startsWith("http") ? u : `${SITE}${u}`)),
      }),
    });
    return { ok: res.ok || res.status === 202, status: res.status };
  } catch (err) {
    console.error("IndexNow submit failed:", err);
    return { ok: false, error: err };
  }
}