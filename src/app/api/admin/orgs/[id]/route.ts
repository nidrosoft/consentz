import { NextRequest } from "next/server";
import { z } from "zod";
import { withAdmin } from "@/lib/api-handler";
import { apiSuccess, ApiErrors } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async (_req, { params }) => {
    const db = await getDb();
    const { id } = params;

    const { data: org } = await db
        .from("organizations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (!org) return ApiErrors.notFound("Organization");

    const [
        { data: usersRaw },
        { count: staffCount },
        { count: policyCount },
        { count: taskCount },
        { count: gapCount },
        { data: scores },
        { data: subscription },
        { count: evidenceStatusTotal },
        { count: evidenceStatusComplete },
    ] = await Promise.all([
        db.from("users").select("id, email, first_name, last_name, role, created_at, last_login_at").eq("organization_id", id).order("created_at", { ascending: false }),
        db.from("staff_members").select("*", { count: "exact", head: true }).eq("organization_id", id).then((r) => ({ count: r.count ?? 0 })),
        db.from("policies").select("*", { count: "exact", head: true }).eq("organization_id", id).then((r) => ({ count: r.count ?? 0 })),
        db.from("tasks").select("*", { count: "exact", head: true }).eq("organization_id", id).then((r) => ({ count: r.count ?? 0 })),
        db.from("compliance_gaps").select("*", { count: "exact", head: true }).eq("organization_id", id).eq("status", "OPEN").then((r) => ({ count: r.count ?? 0 })),
        db.from("compliance_scores").select("domain_code, score, calculated_at").eq("organization_id", id),
        db.from("subscriptions").select("id, status, plan_id, current_period_start, current_period_end, cancel_at, created_at").eq("organization_id", id).maybeSingle(),
        db.from("kloe_evidence_status").select("*", { count: "exact", head: true }).eq("organization_id", id).then((r) => ({ count: r.count ?? 0 })),
        db.from("kloe_evidence_status").select("*", { count: "exact", head: true }).eq("organization_id", id).eq("status", "complete").then((r) => ({ count: r.count ?? 0 })),
    ]);

    // Map users to expected shape
    const users = (usersRaw ?? []).map((u: Record<string, unknown>) => ({
        id: u.id,
        email: u.email,
        full_name: [u.first_name, u.last_name].filter(Boolean).join(" ") || null,
        role: u.role,
        created_at: u.created_at,
        last_sign_in_at: u.last_login_at ?? null,
    }));

    // Build compliance object from per-domain rows
    const domainScoreMap: Record<string, number> = {};
    let latestDate: string | null = null;
    for (const s of (scores ?? []) as Record<string, unknown>[]) {
        domainScoreMap[(s.domain_code as string) ?? ""] = (s.score as number) ?? 0;
        const d = s.calculated_at as string;
        if (!latestDate || d > latestDate) latestDate = d;
    }
    const domainVals = Object.values(domainScoreMap);
    const overallScore = domainVals.length > 0 ? Math.round(domainVals.reduce((a, b) => a + b, 0) / domainVals.length) : 0;

    const compliance = domainVals.length > 0 ? {
        overall_score: overallScore,
        safe_score: domainScoreMap["safe"] ?? 0,
        effective_score: domainScoreMap["effective"] ?? 0,
        caring_score: domainScoreMap["caring"] ?? 0,
        responsive_score: domainScoreMap["responsive"] ?? 0,
        well_led_score: domainScoreMap["well_led"] ?? domainScoreMap["well-led"] ?? 0,
        updated_at: latestDate,
    } : null;

    // Recent activity for this org
    const { data: activity } = await db
        .from("audit_logs")
        .select("id, user_name, action, entity_type, created_at")
        .eq("organization_id", id)
        .order("created_at", { ascending: false })
        .limit(15);

    return apiSuccess({
        organization: org,
        users,
        counts: {
            staff: staffCount,
            policies: policyCount,
            tasks: taskCount,
            openGaps: gapCount,
            evidenceItems: evidenceStatusTotal,
            evidenceComplete: evidenceStatusComplete,
        },
        compliance,
        subscription,
        recentActivity: activity ?? [],
    });
});

const orgUpdateSchema = z.object({
    action: z.enum(["update_tier", "activate", "deactivate"]),
    tier: z.enum(["free", "professional", "enterprise"]).optional(),
});

export const PATCH = withAdmin(async (req: NextRequest, { params }) => {
    const db = await getDb();
    const { id } = params;
    const body = await req.json();
    const { action, tier } = orgUpdateSchema.parse(body);

    const { data: org } = await db.from("organizations").select("id").eq("id", id).maybeSingle();
    if (!org) return ApiErrors.notFound("Organization");

    if (action === "update_tier") {
        if (!tier) return ApiErrors.badRequest("Tier is required");
        await db.from("organizations").update({ subscription_tier: tier }).eq("id", id);
        return apiSuccess({ message: `Tier updated to ${tier}` });
    }

    if (action === "deactivate") {
        await db.from("organizations").update({ subscription_status: "canceled" }).eq("id", id);
        return apiSuccess({ message: "Organization deactivated" });
    }

    if (action === "activate") {
        await db.from("organizations").update({ subscription_status: "active" }).eq("id", id);
        return apiSuccess({ message: "Organization activated" });
    }

    return ApiErrors.badRequest("Unknown action");
});
