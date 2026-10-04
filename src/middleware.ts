import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const auth = req.headers.get("authorization");
    const expected = "Basic " + Buffer.from(`admin:${process.env.ADMIN_BASIC_PASS}`).toString("base64");

    if (auth !== expected) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": "Basic realm='Admin Area'" },
      });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };