import { NextResponse } from "next/server";

import { ensureDbUserForSupabaseAuth } from "@/lib/auth-sync";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await ensureDbUserForSupabaseAuth(user);
    } catch (e) {
        console.error("[ensure-user]", e);
        return NextResponse.json({ error: "Could not sync user" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
