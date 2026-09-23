import { NextRequest, NextResponse } from "next/server";
import { submitToIndexNow } from "../../../lib/indexnow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urls: string[] = Array.isArray(body?.urls) ? body.urls : [];

    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "urls array required" },
        { status: 400 }
      );
    }

    const result = await submitToIndexNow(urls);
    return NextResponse.json({ success: result.ok, ...result });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}