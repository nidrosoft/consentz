import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async (req: NextRequest) => {
    const db = await getDb();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    let query = db.from("policies").select(
        "id, title, status, domains, next_review_date, updated_at, organization_id, created_at",
        { count: "exact" },
    );

    if (search) query = query.ilike("title", `%${search}%`);
    if (status) query = query.eq("status", status);

    const { data, count } = await query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

    const orgIds = [...new Set((data ?? []).map((p: Record<string, unknown>) => p.organization_id).filter(Boolean))];
    let orgMap: Record<string, Record<string, unknown>> = {};
    if (orgIds.length > 0) {
        const { data: orgs } = await db.from("organizations").select("id, name, service_type").in("id", orgIds);
        orgMap = Object.fromEntries((orgs ?? []).map((o: Record<string, unknown>) => [o.id as string, o]));
    }

    const enriched = (data ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        cqc_domain: Array.isArray(p.domains) ? (p.domains as string[])[0] ?? null : p.domains ?? null,
        review_date: p.next_review_date ?? null,
        organizationName: (orgMap[p.organization_id as string]?.name as string) ?? null,
        serviceType: (orgMap[p.organization_id as string]?.service_type as string) ?? null,
    }));

    const total = count ?? 0;
    return apiSuccess(enriched, { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: offset + pageSize < total });
});
