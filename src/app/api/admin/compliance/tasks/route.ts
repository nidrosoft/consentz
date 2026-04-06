import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async (req: NextRequest) => {
    const db = await getDb();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status") ?? "";
    const priority = url.searchParams.get("priority") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    let query = db.from("tasks").select("id, title, description, status, priority, due_date, assigned_to_name, organization_id, created_at", { count: "exact" });

    if (search) query = query.ilike("title", `%${search}%`);
    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data, count } = await query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

    const orgIds = [...new Set((data ?? []).map((t: Record<string, unknown>) => t.organization_id).filter(Boolean))];
    let orgMap: Record<string, Record<string, unknown>> = {};
    if (orgIds.length > 0) {
        const { data: orgs } = await db.from("organizations").select("id, name, service_type").in("id", orgIds);
        orgMap = Object.fromEntries((orgs ?? []).map((o: Record<string, unknown>) => [o.id as string, o]));
    }

    const enriched = (data ?? []).map((t: Record<string, unknown>) => ({
        ...t,
        organizationName: (orgMap[t.organization_id as string]?.name as string) ?? null,
        serviceType: (orgMap[t.organization_id as string]?.service_type as string) ?? null,
    }));

    // KPI counts
    const [{ count: totalOpen }, { count: overdue }, { count: completedMonth }] = await Promise.all([
        db.from("tasks").select("*", { count: "exact", head: true }).in("status", ["TODO", "IN_PROGRESS"]).then((r) => ({ count: r.count ?? 0 })),
        db.from("tasks").select("*", { count: "exact", head: true }).in("status", ["TODO", "IN_PROGRESS"]).lt("due_date", new Date().toISOString()).then((r) => ({ count: r.count ?? 0 })),
        db.from("tasks").select("*", { count: "exact", head: true }).eq("status", "DONE").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).then((r) => ({ count: r.count ?? 0 })),
    ]);

    const total = count ?? 0;
    return apiSuccess(enriched, {
        page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: offset + pageSize < total,
        kpis: { totalOpen, overdue, completedThisMonth: completedMonth },
    } as Record<string, unknown>);
});
