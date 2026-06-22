import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = [
  "/dashboard", "/leads", "/properties", "/viewings", "/deals",
  "/communications", "/ai-actions", "/reports", "/calendar",
  "/settings", "/help",
];

/** Pages that signed-in users should NOT see (redirect to /dashboard). */
const AUTH_ONLY_ROUTES = ["/login", "/signup", "/forgot-password"];

/** Always public — never redirect. */
const PUBLIC_ROUTES = ["/", "/auth/callback", "/auth/verify-email"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { response: res, user } = await updateSession(request, response);
  const { pathname } = request.nextUrl;

  // Always allow public routes and static assets
  if (PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p))) {
    return res;
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p));

  // Unauthenticated → send to login
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated → skip auth pages
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Onboarding: authenticated but not yet complete
  // The app layout handles the actual redirect — middleware just allows onboarding through
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
