import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async (req: NextRequest) => {
    const db = await getDb();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    let query = db.from("evidence_items").select(
        "id, title, description, status, file_type, file_url, domains, kloe_code, category, expiry_date, organization_id, created_at",
        { count: "exact" },
    );

    if (search) query = query.ilike("title", `%${search}%`);

    const { data, count } = await query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

    const orgIds = [...new Set((data ?? []).map((e: Record<string, unknown>) => e.organization_id).filter(Boolean))];
    let orgMap: Record<string, Record<string, unknown>> = {};
    if (orgIds.length > 0) {
        const { data: orgs } = await db.from("organizations").select("id, name, service_type").in("id", orgIds);
        orgMap = Object.fromEntries((orgs ?? []).map((o: Record<string, unknown>) => [o.id as string, o]));
    }

    const enriched = (data ?? []).map((e: Record<string, unknown>) => ({
        ...e,
        type: e.file_type ?? e.category ?? null,
        organizationName: (orgMap[e.organization_id as string]?.name as string) ?? null,
        serviceType: (orgMap[e.organization_id as string]?.service_type as string) ?? null,
    }));

    const now = new Date();
    const thirtyDays = new Date(Date.now() + 30 * 86400000);
    const expiringSoon = (data ?? []).filter((e: Record<string, unknown>) => e.expiry_date && new Date(e.expiry_date as string) <= thirtyDays && new Date(e.expiry_date as string) > now).length;
    const expired = (data ?? []).filter((e: Record<string, unknown>) => e.expiry_date && new Date(e.expiry_date as string) <= now).length;

    const total = count ?? 0;
    return apiSuccess(enriched, {
        page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: offset + pageSize < total,
        kpis: { total: count ?? 0, expiringSoon, expired },
    } as Record<string, unknown>);
});
