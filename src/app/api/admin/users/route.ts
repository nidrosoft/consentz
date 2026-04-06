import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async (req: NextRequest) => {
    const db = await getDb();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")));
    const offset = (page - 1) * pageSize;

    let query = db
        .from("users")
        .select("id, email, first_name, last_name, role, organization_id, created_at, last_login_at", { count: "exact" });

    if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

    if (error) {
        console.error("[ADMIN_USERS]", error.message);
    }

    const total = count ?? 0;

    // Attach org names for display
    const orgIds = [...new Set((data ?? []).map((u: Record<string, unknown>) => u.organization_id).filter(Boolean))];
    let orgMap: Record<string, string> = {};
    if (orgIds.length > 0) {
        const { data: orgs } = await db.from("organizations").select("id, name").in("id", orgIds);
        orgMap = Object.fromEntries((orgs ?? []).map((o: { id: string; name: string }) => [o.id, o.name]));
    }

    const enriched = (data ?? []).map((u: Record<string, unknown>) => ({
        ...u,
        full_name: [u.first_name, u.last_name].filter(Boolean).join(" ") || null,
        last_sign_in_at: u.last_login_at ?? null,
        organizationName: orgMap[(u.organization_id as string) ?? ""] ?? null,
    }));

    return apiSuccess(enriched, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: offset + pageSize < total,
    });
});
