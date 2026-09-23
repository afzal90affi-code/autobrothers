import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "../../../../lib/sanityadmin";

export const runtime = "nodejs";

async function doWrite(fn: () => Promise<any>) {
  try {
    const result = await fn();
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Sanity write error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Sanity write failed" },
      { status: 500 }
    );
  }
}

/* ---------- CREATE (blog / category / subcategory) ---------- */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body.action === "category") {
    return doWrite(() =>
      writeClient.create({
        _type: "blogCategory",
        title: body.title,
        slug: { _type: "slug", current: body.slug },
      })
    );
  }

  if (body.action === "subcategory") {
    return doWrite(() =>
      writeClient.create({
        _type: "blogSubcategory",
        title: body.title,
        slug: { _type: "slug", current: body.slug },
        parentCategory: { _type: "reference", _ref: body.parentId },
      })
    );
  }

  return doWrite(() => writeClient.create(body.doc));
}

/* ---------- IMAGE UPLOAD ---------- */
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await writeClient.assets.upload("image", buffer, { filename: file.name });
    return NextResponse.json({ success: true, assetId: asset._id });
  } catch (err: any) {
    console.error("Sanity upload error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/* ---------- UPDATE ---------- */
export async function PATCH(req: NextRequest) {
  try {
    const { id, patch } = await req.json();
    if (!id || !patch) {
      return NextResponse.json({ success: false, error: "id and patch required" }, { status: 400 });
    }
    const result = await writeClient.patch(id).set(patch).commit();
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Sanity patch error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/* ---------- DELETE ---------- */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    }
    await writeClient.delete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Sanity delete error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}