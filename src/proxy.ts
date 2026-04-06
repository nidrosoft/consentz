import { type NextRequest, NextResponse } from "next/server";

import { refreshSupabaseSession } from "@/lib/supabase/proxy-session";

const PUBLIC_PREFIXES = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/auth/callback",
    "/auth/auth-code-error",
];
const PUBLIC_API_PREFIXES = ["/api/webhooks", "/api/cron"];

const ONBOARDING_PREFIXES = ["/welcome", "/assessment"];

/** Authenticated routes that must not be blocked by the onboarding gate (e.g. password recovery). */
const ONBOARDING_BYPASS_PREFIXES = ["/auth/update-password"];

function isPublicPath(pathname: string): boolean {
    if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
    if (pathname.startsWith("/api/") && PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
    return false;
}

function isOnboardingPath(pathname: string): boolean {
    return ONBOARDING_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function bypassesOnboardingGate(pathname: string): boolean {
    return ONBOARDING_BYPASS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
    if (process.env.AUTH_DEV_BYPASS === "true") {
        return NextResponse.next({ request });
    }

    const { supabaseResponse, user } = await refreshSupabaseSession(request);
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api/")) {
        return supabaseResponse;
    }

    if (isPublicPath(pathname)) {
        return supabaseResponse;
    }

    if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/sign-in";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    if (bypassesOnboardingGate(pathname)) {
        return supabaseResponse;
    }

    const onboardingComplete = user.user_metadata?.onboarding_complete === true;

    if (!onboardingComplete && !isOnboardingPath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/welcome";
        return NextResponse.redirect(url);
    }

    if (onboardingComplete && isOnboardingPath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
