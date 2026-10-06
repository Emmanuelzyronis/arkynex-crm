import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard", "/leads", "/properties", "/viewings", "/deals",
  "/communications", "/ai-actions", "/reports", "/calendar",
  "/settings", "/help",
];

/** Pages that signed-in users should NOT see (redirect to /dashboard). */
const AUTH_ONLY_ROUTES = ["/login", "/signup", "/forgot-password"];

/** Always public — never redirect. */
const PUBLIC_ROUTES = ["/", "/auth/callback", "/auth/verify-email"];

const isProtectedRoute = createRouteMatcher(PROTECTED_PREFIXES.map((p) => `${p}(.*)`));
const isAuthRoute = createRouteMatcher(AUTH_ONLY_ROUTES.map((p) => `${p}(.*)`));

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // Always allow public routes and static assets
  if (PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Unauthenticated → send to login
  if (isProtectedRoute(request) && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated → skip auth pages
  if (isAuthRoute(request) && userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};