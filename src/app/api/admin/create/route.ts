import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "../../../../lib/sanityadmin";

export const runtime = "nodejs";

/* Sirf yeh types allow — security */
const ALLOWED = [
  "blog", "blogCategory", "blogSubcategory",
  "product", "category", "subcategory",
  "car", "newCar", "financeBank", "carBrand",
];

/* ============================================================
   POST — Create (product, blog, category, car, bank...)
============================================================ */
export async function POST(req: NextRequest) {
  try {
    const { doc } = await req.json();
    if (!doc?._type || !ALLOWED.includes(doc._type)) {
      return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }
    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    console.error("Sanity write error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/* ============================================================
   PUT — Image upload
============================================================ */
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await writeClient.assets.upload("image", buffer, { filename: file.name });
    return NextResponse.json({ success: true, assetId: asset._id });
  } catch (err: any) {
    console.error("Sanity upload error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/* ============================================================
   DELETE — Document delete by id
============================================================ */
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

/* ============================================================
   PATCH — Update document fields by id
============================================================ */
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