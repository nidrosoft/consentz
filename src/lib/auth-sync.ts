import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * The database trigger `on_auth_user_created` handles the initial insert.
 * This function is a safety net that upserts profile data if the trigger
 * didn't fire or if we need to refresh fields (e.g. after OAuth metadata change).
 */
export async function ensureDbUserForSupabaseAuth(supabaseUser: SupabaseAuthUser) {
    const email = supabaseUser.email?.trim() ?? "";
    const meta = supabaseUser.user_metadata as Record<string, unknown> | undefined;
    const firstName = typeof meta?.first_name === "string" ? meta.first_name : null;
    const lastName = typeof meta?.last_name === "string" ? meta.last_name : null;
    const avatarUrl = typeof meta?.avatar_url === "string" ? meta.avatar_url : null;

    if (!email) {
        throw new Error("Supabase user has no email");
    }

    const supabase = await createServerSupabaseClient();

    const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("supabase_user_id", supabaseUser.id)
        .maybeSingle();

    if (existing) {
        await supabase
            .from("users")
            .update({
                email,
                first_name: firstName,
                last_name: lastName,
                avatar_url: avatarUrl,
            })
            .eq("supabase_user_id", supabaseUser.id);
    } else {
        const { error } = await supabase.from("users").insert({
            supabase_user_id: supabaseUser.id,
            email,
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
        });
        if (error) throw new Error(`Profile insert failed: ${error.message}`);
    }
}
