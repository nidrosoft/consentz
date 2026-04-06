import { NextRequest } from "next/server";
import { z } from "zod";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess, ApiErrors } from "@/lib/api-response";
import { getDb } from "@/lib/db";

const updateSchema = z.object({
    action: z.enum(["update_role", "suspend", "activate", "reset_password", "delete"]),
    role: z.enum(["OWNER", "ADMIN", "COMPLIANCE_MANAGER", "MEMBER", "VIEWER", "STAFF_MEMBER"]).optional(),
});

export const GET = withAdmin(async (_req, { params }) => {
    const db = await getDb();
    const { id } = params;

    const { data: user } = await db
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (!user) return ApiErrors.notFound("User");

    let orgName: string | null = null;
    if (user.organization_id) {
        const { data: org } = await db.from("organizations").select("name").eq("id", user.organization_id).maybeSingle();
        orgName = org?.name ?? null;
    }

    const { data: activity } = await db
        .from("audit_logs")
        .select("id, action, entity_type, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(20);

    return apiSuccess({
        user: {
            ...user,
            full_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
            last_sign_in_at: user.last_login_at ?? null,
        },
        organizationName: orgName,
        recentActivity: activity ?? [],
    });
});

export const PATCH = withAdmin(async (req: NextRequest, { params }) => {
    const db = await getDb();
    const { id } = params;
    const body = await req.json();
    const { action, role } = updateSchema.parse(body);

    const { data: user } = await db.from("users").select("id, role, email").eq("id", id).maybeSingle();
    if (!user) return ApiErrors.notFound("User");

    if (action === "update_role") {
        if (!role) return ApiErrors.badRequest("Role is required for update_role action");
        await db.from("users").update({ role }).eq("id", id);
        return apiSuccess({ message: `Role updated to ${role}` });
    }

    if (action === "suspend") {
        await db.from("users").update({ role: "SUSPENDED" }).eq("id", id);
        // Also ban the user in Supabase Auth to prevent sign-in
        try {
            await db.auth.admin.updateUserById(id, { ban_duration: "876600h" }); // ~100 years
        } catch (e) {
            console.warn("[ADMIN] Could not ban auth user:", e);
        }
        return apiSuccess({ message: "User suspended" });
    }

    if (action === "activate") {
        await db.from("users").update({ role: role ?? "MEMBER" }).eq("id", id);
        // Unban the user in Supabase Auth
        try {
            await db.auth.admin.updateUserById(id, { ban_duration: "none" });
        } catch (e) {
            console.warn("[ADMIN] Could not unban auth user:", e);
        }
        return apiSuccess({ message: "User activated" });
    }

    if (action === "reset_password") {
        try {
            const { error } = await db.auth.admin.generateLink({
                type: "recovery",
                email: user.email,
            });
            if (error) return apiSuccess({ error: error.message });
        } catch (e) {
            console.warn("[ADMIN] Password reset link failed:", e);
            return apiSuccess({ error: "Failed to generate reset link" });
        }
        return apiSuccess({ message: "Password reset email sent" });
    }

    if (action === "delete") {
        // Soft-delete from users table
        await db.from("users").update({ role: "DELETED" }).eq("id", id);
        // Delete from Supabase Auth
        try {
            await db.auth.admin.deleteUser(id);
        } catch (e) {
            console.warn("[ADMIN] Could not delete auth user:", e);
        }
        return apiSuccess({ message: "User deleted" });
    }

    return ApiErrors.badRequest("Unknown action");
});
