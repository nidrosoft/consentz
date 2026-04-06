import { NextRequest } from "next/server";
import { z } from "zod";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess, ApiErrors } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async (_req, { admin }) => {
    if (admin.role !== "super_admin") return ApiErrors.forbidden("Only super admins can manage admin accounts.");

    const db = await getDb();
    const { data } = await db
        .from("platform_admins")
        .select("id, auth_user_id, email, platform_role, created_at, created_by")
        .order("created_at", { ascending: true });

    return apiSuccess(data ?? []);
});

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(["super_admin", "support_admin"]).default("support_admin"),
});

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
    if (admin.role !== "super_admin") return ApiErrors.forbidden("Only super admins can invite new admins.");

    const db = await getDb();
    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

    // Check if already an admin
    const { data: existing } = await db
        .from("platform_admins")
        .select("id")
        .eq("email", email)
        .maybeSingle();

    if (existing) {
        return ApiErrors.badRequest("This email is already a platform admin.");
    }

    // Check if the user exists in auth
    const { data: userList, error: listError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authUser = userList?.users?.find((u) => u.email === email);

    let authUserId: string;

    if (authUser) {
        authUserId = authUser.id;
    } else {
        // Create the auth user with a temporary password; they'll use password reset to set their own
        const tempPassword = `Admin_${crypto.randomUUID().slice(0, 12)}!`;
        const { data: newUser, error: createError } = await db.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
        });

        if (createError || !newUser?.user) {
            console.error("[ADMIN_INVITE]", createError?.message ?? listError?.message);
            return ApiErrors.internal("Failed to create auth account.");
        }
        authUserId = newUser.user.id;

        // Send a password reset so they can set their own password
        await db.auth.admin.generateLink({ type: "recovery", email });
    }

    // Insert into platform_admins
    const { error: insertError } = await db.from("platform_admins").insert({
        auth_user_id: authUserId,
        email,
        platform_role: role,
        created_by: admin.email,
    });

    if (insertError) {
        console.error("[ADMIN_INVITE]", insertError.message);
        return ApiErrors.internal("Failed to add admin record.");
    }

    return apiSuccess({ message: `Admin invite sent to ${email}`, role });
});

const removeSchema = z.object({ adminId: z.string().uuid() });

export const DELETE = withAdmin(async (req: NextRequest, { admin }) => {
    if (admin.role !== "super_admin") return ApiErrors.forbidden("Only super admins can remove admins.");

    const db = await getDb();
    const body = await req.json();
    const { adminId } = removeSchema.parse(body);

    // Prevent self-removal
    const { data: target } = await db.from("platform_admins").select("auth_user_id").eq("id", adminId).maybeSingle();
    if (!target) return ApiErrors.notFound("Admin");
    if (target.auth_user_id === admin.userId) {
        return ApiErrors.badRequest("You cannot remove yourself from the platform admin list.");
    }

    await db.from("platform_admins").delete().eq("id", adminId);
    return apiSuccess({ message: "Admin removed" });
});
