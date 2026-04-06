import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async (req: NextRequest) => {
    const db = await getDb();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const action = url.searchParams.get("action") ?? "";
    const orgId = url.searchParams.get("orgId") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = 30;
    const offset = (page - 1) * pageSize;

    let query = db.from("audit_logs").select("id, organization_id, user_id, user_name, entity_type, entity_id, action, details, created_at", { count: "exact" });

    if (search) query = query.or(`user_name.ilike.%${search}%,action.ilike.%${search}%,entity_type.ilike.%${search}%`);
    if (action) query = query.eq("action", action);
    if (orgId) query = query.eq("organization_id", orgId);

    const { data, count } = await query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

    // Enrich with org names
    const orgIds = [...new Set((data ?? []).map((l: Record<string, unknown>) => l.organization_id).filter(Boolean))];
    let orgMap: Record<string, string> = {};
    if (orgIds.length > 0) {
        const { data: orgs } = await db.from("organizations").select("id, name").in("id", orgIds);
        orgMap = Object.fromEntries((orgs ?? []).map((o: { id: string; name: string }) => [o.id, o.name]));
    }

    const enriched = (data ?? []).map((l: Record<string, unknown>) => ({
        ...l,
        organizationName: orgMap[(l.organization_id as string) ?? ""] ?? null,
    }));

    const total = count ?? 0;
    return apiSuccess(enriched, { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: offset + pageSize < total });
});
