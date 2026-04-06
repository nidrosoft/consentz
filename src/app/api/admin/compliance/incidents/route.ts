import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async (req: NextRequest) => {
    const db = await getDb();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status") ?? "";
    const severity = url.searchParams.get("severity") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    let query = db.from("incidents").select(
        "id, title, description, incident_type, severity, status, reported_by, reported_at, resolved_at, organization_id, created_at",
        { count: "exact" },
    );

    if (search) query = query.ilike("title", `%${search}%`);
    if (status) query = query.eq("status", status);
    if (severity) query = query.eq("severity", severity);

    const { data, count } = await query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

    const orgIds = [...new Set((data ?? []).map((i: Record<string, unknown>) => i.organization_id).filter(Boolean))];
    let orgMap: Record<string, Record<string, unknown>> = {};
    if (orgIds.length > 0) {
        const { data: orgs } = await db.from("organizations").select("id, name, service_type").in("id", orgIds);
        orgMap = Object.fromEntries((orgs ?? []).map((o: Record<string, unknown>) => [o.id as string, o]));
    }

    const enriched = (data ?? []).map((i: Record<string, unknown>) => ({
        ...i,
        category: i.incident_type ?? null,
        reported_date: i.reported_at ?? null,
        resolution_date: i.resolved_at ?? null,
        organizationName: (orgMap[i.organization_id as string]?.name as string) ?? null,
        serviceType: (orgMap[i.organization_id as string]?.service_type as string) ?? null,
    }));

    const total = count ?? 0;
    return apiSuccess(enriched, { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: offset + pageSize < total });
});
