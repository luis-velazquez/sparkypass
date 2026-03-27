// Protected routes middleware for SparkyPass
// Simplified version that doesn't require database access
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/quiz",
  "/flashcards",
  "/mock-exam",
  "/daily",
  "/bookmarks",
  "/profile",
  "/load-calculator",
  "/settings",
  "/circuit-breaker",
  "/review",
  "/power-ups",
  "/power-grid",
  "/friends",
  "/leaderboard",
  "/watts",
  "/tips",
  "/index-sniper",
  "/index-game",
  "/translation-engine",
  "/formula-builder",
];

// Routes that bypass the subscription check (but still require auth)
const subscriptionExemptRoutes = ["/settings", "/pricing"];

// Routes that are only for unauthenticated users (auth pages)
const authRoutes = ["/login", "/register"];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  if (pathname === "/register/profile") {
    return false;
  }
  return authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get JWT token — secureCookie must match production (HTTPS) cookie prefix
  const secureCookie = request.nextUrl.protocol === "https:";
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  const isAuthenticated = !!token;
  const isEmailVerified = (token?.isEmailVerified as boolean) ?? false;
  const profileComplete = (token?.profileComplete as boolean) ?? false;

  // Protected routes: redirect to login if not authenticated
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated but email not verified, redirect to verify-email
    if (!isEmailVerified) {
      const verifyUrl = new URL("/verify-email", request.url);
      if (token?.email) {
        verifyUrl.searchParams.set("email", token.email as string);
      }
      return NextResponse.redirect(verifyUrl);
    }

    // If authenticated + verified but profile not complete, redirect to profile completion
    if (!profileComplete && pathname !== "/register/profile") {
      return NextResponse.redirect(new URL("/register/profile", request.url));
    }

    // Subscription check — DISABLED during beta (all features are free)
    // TODO: Re-enable after beta launch with paid tiers
    // const isExempt = subscriptionExemptRoutes.some(
    //   (route) => pathname === route || pathname.startsWith(`${route}/`)
    // );
    //
    // if (!isExempt) {
    //   const subscriptionStatus = token?.subscriptionStatus as string | null;
    //   const trialEndsAt = token?.trialEndsAt as string | null;
    //   const periodEnd = token?.subscriptionPeriodEnd as string | null;
    //
    //   const hasActiveAccess = (() => {
    //     if (subscriptionStatus === "active" || subscriptionStatus === "past_due") return true;
    //     if (subscriptionStatus === "canceled" && periodEnd && new Date(periodEnd) > new Date()) return true;
    //     if (subscriptionStatus === "trialing" && trialEndsAt && new Date(trialEndsAt) > new Date()) return true;
    //     return false;
    //   })();
    //
    //   if (!hasActiveAccess) {
    //     return NextResponse.redirect(new URL("/pricing", request.url));
    //   }
    // }
  }

  // /register/profile requires authentication + email verification
  if (pathname === "/register/profile") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!isEmailVerified) {
      const verifyUrl = new URL("/verify-email", request.url);
      if (token?.email) {
        verifyUrl.searchParams.set("email", token.email as string);
      }
      return NextResponse.redirect(verifyUrl);
    }
    if (profileComplete) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // /verify-email handling
  if (pathname === "/verify-email") {
    // If authenticated and already verified, redirect away
    if (isAuthenticated && isEmailVerified) {
      if (!profileComplete) {
        return NextResponse.redirect(new URL("/register/profile", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Otherwise allow: unauthenticated (clicking link) or authenticated + unverified
    return NextResponse.next();
  }

  // Auth routes: redirect to dashboard if already authenticated
  if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      if (!isEmailVerified) {
        const verifyUrl = new URL("/verify-email", request.url);
        if (token?.email) {
          verifyUrl.searchParams.set("email", token.email as string);
        }
        return NextResponse.redirect(verifyUrl);
      }
      if (!profileComplete) {
        return NextResponse.redirect(new URL("/register/profile", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Homepage: redirect authenticated users to dashboard (or pricing if expired)
  if (pathname === "/") {
    if (isAuthenticated) {
      if (!isEmailVerified) {
        const verifyUrl = new URL("/verify-email", request.url);
        if (token?.email) {
          verifyUrl.searchParams.set("email", token.email as string);
        }
        return NextResponse.redirect(verifyUrl);
      }
      if (!profileComplete) {
        return NextResponse.redirect(new URL("/register/profile", request.url));
      }

      // During beta, all authenticated users go to dashboard (no subscription check)
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
