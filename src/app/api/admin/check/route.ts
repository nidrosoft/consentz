import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ isAdmin: false }, {
                headers: { "Cache-Control": "no-store, max-age=0" },
            });
        }

        const db = await getDb();
        const { data } = await db
            .from("platform_admins")
            .select("id, platform_role")
            .eq("auth_user_id", user.id)
            .maybeSingle();

        return NextResponse.json(
            { isAdmin: !!data, role: data?.platform_role ?? null },
            { headers: { "Cache-Control": "no-store, max-age=0" } },
        );
    } catch {
        return NextResponse.json(
            { isAdmin: false },
            { headers: { "Cache-Control": "no-store, max-age=0" } },
        );
    }
}
