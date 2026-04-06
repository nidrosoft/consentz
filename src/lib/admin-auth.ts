import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { AuthError } from "@/lib/auth";

export type AdminRole = "super_admin" | "support_admin";

export interface AdminAuth {
    userId: string;
    email: string;
    role: AdminRole;
}

export async function getAdminAuth(): Promise<AdminAuth> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new AuthError("UNAUTHORIZED", "Not authenticated");
    }

    const db = await getDb();
    const { data: admin } = await db
        .from("platform_admins")
        .select("id, platform_role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (!admin) {
        throw new AuthError("FORBIDDEN", "Not a platform administrator");
    }

    return {
        userId: user.id,
        email: user.email ?? "",
        role: (admin.platform_role as AdminRole) ?? "support_admin",
    };
}
