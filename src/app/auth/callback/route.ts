import { NextResponse } from "next/server";

import { ensureDbUserForSupabaseAuth } from "@/lib/auth-sync";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/welcome";

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    try {
        await ensureDbUserForSupabaseAuth(data.user);
    } catch (e) {
        console.error("[auth/callback] ensure user failed", e);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : `/${next}`}`);
}
