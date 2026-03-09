import { NextRequest, NextResponse } from "next/server";

/**
 * Minimal middleware for the /admin route.
 *
 * The real authentication check happens in the API route (/api/admin).
 * This middleware prevents the admin page from being indexed by search engines.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-robots-tag", "noindex");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
