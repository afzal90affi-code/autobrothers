import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// 🎯 AUTOBROTHERS WATERMARK API
// Koi bhi image ?src= me do — ye sharp se "autobrothers.pk" watermark
// laga kar WebP return karta hai. Fail hone par original image pe redirect
// karta hai (site kabhi tootegi nahi).

export const runtime = "nodejs";

const WM_TEXT = "autobrothers.pk";

// 🔒 Sirf yehi domains se images fetch hongi (same-origin hamesha allowed).
// Agar images kisi aur CDN par hain to hostname yahan add karen.
const ALLOWED_HOSTS: string[] = [
  "i.ibb.co", // ImgBB — aapki product images yahan hain
  "cdn.sanity.io",
  // "example.com",
];

function buildWatermarkSvg(w: number, h: number): string {
  // Font size image ke size ke hisab se — chhoti image pe chhota, bari pe bara
  const fontSize = Math.max(16, Math.round(Math.min(w, h) / 16));
  const stepX = fontSize * 9;
  const stepY = fontSize * 4.5;
  const angle = -30;
  const cols = Math.ceil(w / stepX) + 3;
  const rows = Math.ceil(h / stepY) + 3;

  let texts = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * stepX + (r % 2 === 0 ? 0 : stepX / 2) - stepX;
      const y = r * stepY;
      texts += `<text x="${x}" y="${y}" transform="rotate(${angle} ${x} ${y})">${WM_TEXT}</text>`;
    }
  }

  // White semi-transparent + halka dark stroke — light aur dark dono images par nazar aata hai
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <g fill="rgba(255,255,255,0.30)" stroke="rgba(0,0,0,0.20)" stroke-width="0.6"
       font-family="Arial, Helvetica, sans-serif" font-weight="700"
       font-size="${fontSize}">${texts}</g>
  </svg>`;
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