import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const publicPaths = ["/", "/login", "/register", "/demo"];
  const isPublicPath = publicPaths.some((p) => path === p || path.startsWith("/status/"));

  // Check for auth token
  const token = request.cookies.get("access_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // Redirect unauthenticated users to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if ((path === "/login" || path === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
