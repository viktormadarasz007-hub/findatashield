import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasRecoveryQueryParams } from "@/lib/auth-recovery";
import { parseCheckoutIntent } from "@/lib/checkout-intent";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/terms",
  "/privacy",
  "/contact",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isAuthRoute(pathname: string): boolean {
  return pathname === "/auth/callback" || pathname.startsWith("/auth/");
}

function shouldBypassAuthRedirects(pathname: string, searchParams: URLSearchParams): boolean {
  return (
    isAuthRoute(pathname) ||
    pathname === "/reset-password" ||
    hasRecoveryQueryParams(searchParams)
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;

  if (
    hasRecoveryQueryParams(searchParams) &&
    pathname !== "/reset-password"
  ) {
    const resetUrl = request.nextUrl.clone();
    resetUrl.pathname = "/reset-password";
    return NextResponse.redirect(resetUrl);
  }

  const bypassAuthRedirects = shouldBypassAuthRedirects(pathname, searchParams);

  if (isAuthRoute(pathname)) {
    return supabaseResponse;
  }

  if (user && pathname === "/" && !bypassAuthRedirects) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  if (!user && !isPublicPath(pathname)) {
    if (pathname.startsWith("/api/")) {
      return supabaseResponse;
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    (pathname === "/login" || pathname === "/signup") &&
    !bypassAuthRedirects
  ) {
    const checkoutIntent = parseCheckoutIntent(searchParams);
    if (checkoutIntent) {
      const checkoutUrl = request.nextUrl.clone();
      checkoutUrl.pathname = "/pricing";
      checkoutUrl.searchParams.set("checkout", checkoutIntent.tier);
      checkoutUrl.searchParams.set("billing", checkoutIntent.billing);
      return NextResponse.redirect(checkoutUrl);
    }

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
