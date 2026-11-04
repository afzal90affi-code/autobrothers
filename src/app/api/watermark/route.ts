import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// 🎯 AUTOBROTHERS WATERMARK API
// Koi bhi image ?src= me do — ye sharp se "autobrothers.pk" watermark
// laga kar WebP return karta hai. Fail hone par original image pe redirect
// karta hai (site kabhi tootegi nahi).
//
// ✅ FONT-FREE WATERMARK: pehle text SVG <text> se banta tha jo server ke
// fonts par depend karta tha — Vercel ke Linux par Arial nahi hota isliye
// boxes (□□□) nazar aati theen. Ab letters vector PATHS hain — har jagah
// (localhost + Vercel) bilkul same aur saaf dikhega.

export const runtime = "nodejs";

const WM_TEXT = "autobrothers.pk";

// 🔒 Sirf yehi domains se images fetch hongi (same-origin hamesha allowed).
// Agar images kisi aur CDN par hain to hostname yahan add karen.
const ALLOWED_HOSTS: string[] = [
  "i.ibb.co", // ImgBB — aapki product images yahan hain
  "cdn.sanity.io",
  // "example.com",
];

/* ============================================================
   ✅ MONOLINE VECTOR GLYPHS — "autobrothers.pk" ke letters
   Har letter aik chhoti drawing hai (100-unit em box, baseline y=78,
   x-height y=28, ascender y=8, descender y=98). Kisi font ki zaroorat
   nahi — Vercel, localhost, kahin bhi same render hoga.
============================================================ */
const GLYPHS: Record<string, { w: number; d: string }> = {
  a: { w: 52, d: "M52,28 V78 M2,53 a25,25 0 1,0 50,0 a25,25 0 1,0 -50,0" },
  u: { w: 62, d: "M10,28 V53 a25,25 0 0,0 50,0 V28" },
  t: { w: 50, d: "M20,10 V64 a14,14 0 0,0 28,14 M6,28 H42" },
  o: { w: 60, d: "M5,53 a25,25 0 1,0 50,0 a25,25 0 1,0 -50,0" },
  b: { w: 62, d: "M10,8 V78 M10,28 a25,25 0 0,1 0,50" },
  e: { w: 54, d: "M2,53 a25,25 0 1,0 50,0 a25,25 0 1,0 -50,0 M0,53 H52" },
  r: { w: 40, d: "M12,28 V78 M12,46 a24,24 0 0,1 24,-18" },
  s: { w: 48, d: "M44,38 a16,16 0 0,0 -16,-10 a12,12 0 0,0 -12,10 a10,10 0 0,0 6,9 l10,2 a10,10 0 0,1 6,9 a12,12 0 0,1 -12,10 a16,16 0 0,1 -16,-10" },
  p: { w: 64, d: "M12,28 V98 M12,28 a25,25 0 0,1 0,50" },
  k: { w: 46, d: "M12,8 V78 M42,28 L12,58 M24,46 L44,78" },
  ".": { w: 16, d: "" }, // dot — circle ke tor par render hota hai
};

function buildWatermarkSvg(w: number, h: number): string {
  // Font size image ke size ke hisab se — chhoti image pe chhota, bari pe bara
  const fontSize = Math.max(16, Math.round(Math.min(w, h) / 16));
  const s = fontSize / 100;
  const stepX = fontSize * 9;
  const stepY = fontSize * 4.5;
  const angle = -30;
  const cols = Math.ceil(w / stepX) + 3;
  const rows = Math.ceil(h / stepY) + 3;

  const SPACING = 8; // letters ke darmiyan gap (em units)

  let tiles = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * stepX + (r % 2 === 0 ? 0 : stepX / 2) - stepX;
      const y = r * stepY;

      let gx = 0;
      let glyphs = "";
      for (const ch of WM_TEXT) {
        const g = GLYPHS[ch];
        if (!g) continue;
        if (ch === ".") {
          // Halka dark shadow + white dot — har background par nazar aata hai
          glyphs += `<circle cx="${gx + 8}" cy="74" r="11" fill="rgba(0,0,0,0.22)" stroke="none"/>`;
          glyphs += `<circle cx="${gx + 8}" cy="74" r="7" fill="rgba(255,255,255,0.40)" stroke="none"/>`;
        } else {
          // Har path double: pehle dark (shadow), phir white — light aur
          // dark dono images par readable
          glyphs += `<path d="${g.d}" transform="translate(${gx} 0)" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="14"/>`;
          glyphs += `<path d="${g.d}" transform="translate(${gx} 0)" fill="none" stroke="rgba(255,255,255,0.40)" stroke-width="8"/>`;
        }
        gx += g.w + SPACING;
      }

      tiles += `<g transform="translate(${x} ${y - 78 * s}) rotate(${angle}) scale(${s})">${glyphs}</g>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${tiles}</svg>`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const src = sp.get("src") || "";
  const w = Math.max(64, Math.min(Number(sp.get("w")) || 800, 1600));
  const q = Math.max(30, Math.min(Number(sp.get("q")) || 75, 100));

  let target: URL;
  try {
    target = new URL(src, req.nextUrl.origin);
  } catch {
    return NextResponse.redirect(req.nextUrl.origin);
  }

  const sameOrigin = target.origin === req.nextUrl.origin;
  const protocolOk = target.protocol === "https:" || target.protocol === "http:";
  if (!protocolOk || (!sameOrigin && !ALLOWED_HOSTS.includes(target.hostname))) {
    // Ijazat nahi → original pe bhej do
    return NextResponse.redirect(target.toString());
  }

  try {
    const res = await fetch(target, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.redirect(target.toString());
    const input = Buffer.from(await res.arrayBuffer());

    const base = sharp(input, { failOn: "none" }).rotate(); // EXIF auto-rotate
    const meta = await base.metadata();
    if (!meta.width) return NextResponse.redirect(target.toString());

    const outW = Math.min(w, meta.width); // kabhi bara nahi karenge
    const outH = Math.round((meta.height ?? outW) * (outW / meta.width));

    const svg = Buffer.from(buildWatermarkSvg(outW, outH));
    const out = await base
      .resize({ width: outW })
      .composite([{ input: svg, blend: "over" }])
      .webp({ quality: q })
      .toBuffer();

    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        // max-age → browser cache | s-maxage → Vercel edge cache
        // (repeat requests function ko chalaye baghair CDN se serve hongi)
        "Cache-Control":
          "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch {
    // Koi bhi masla ho → original image
    return NextResponse.redirect(target.toString());
  }
}