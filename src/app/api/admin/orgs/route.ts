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
        .from("organizations")
        .select("id, name, service_type, subscription_tier, subscription_status, created_at, consentz_clinic_id", { count: "exact" })
        .is("deleted_at", null);

    if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

    if (error) {
        console.error("[ADMIN_ORGS]", error.message);
    }

    const total = count ?? 0;

    return apiSuccess(data ?? [], {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: offset + pageSize < total,
    });
});
