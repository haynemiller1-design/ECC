import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, protocol } = request.nextUrl;

  // 1. Block CVE-2025-29927 header as defense-in-depth (Next.js 16 is patched, but
  //    stripping it at middleware level prevents exploitation on any downgrade or fork).
  if (request.headers.get("x-middleware-subrequest")) {
    return new NextResponse(null, { status: 403 });
  }

  // 2. Enforce HTTPS in production — redirect http → https
  if (
    process.env.NODE_ENV === "production" &&
    protocol === "http:" &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api")
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 3. Strip sensitive internal headers that must never come from the client
  const response = NextResponse.next();
  response.headers.delete("x-middleware-subrequest");
  response.headers.delete("x-nextjs-data");

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static assets and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|models/).*)",
  ],
};
