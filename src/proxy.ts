import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const authRoutes = new Set(["/login"]);
const protectedRoutes = ["/bookmarks"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.has(pathname);

  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    const redirectPath = `${pathname}${request.nextUrl.search}`;

    if (redirectPath !== "/login") {
      loginUrl.searchParams.set("next", redirectPath);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/bookmarks", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/bookmarks/:path*",
    "/auth/callback",
  ],
};
