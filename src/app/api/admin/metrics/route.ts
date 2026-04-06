import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async () => {
    const db = await getDb();

    const [
        { count: orgCount },
        { count: activeOrgCount },
        { count: userCount },
        { count: staffCount },
        { count: policyCount },
        { count: taskCount },
        { count: openTaskCount },
        { count: gapCount },
        { count: evidenceCount },
        { count: incidentCount },
    ] = await Promise.all([
        db.from("organizations").select("*", { count: "exact", head: true }).is("deleted_at", null).then((r) => ({ count: r.count ?? 0 })),
        db.from("organizations").select("*", { count: "exact", head: true }).is("deleted_at", null).eq("subscription_status", "active").then((r) => ({ count: r.count ?? 0 })),
        db.from("users").select("*", { count: "exact", head: true }).then((r) => ({ count: r.count ?? 0 })),
        db.from("staff_members").select("*", { count: "exact", head: true }).then((r) => ({ count: r.count ?? 0 })),
        db.from("policies").select("*", { count: "exact", head: true }).then((r) => ({ count: r.count ?? 0 })),
        db.from("tasks").select("*", { count: "exact", head: true }).then((r) => ({ count: r.count ?? 0 })),
        db.from("tasks").select("*", { count: "exact", head: true }).in("status", ["TODO", "IN_PROGRESS"]).then((r) => ({ count: r.count ?? 0 })),
        db.from("compliance_gaps").select("*", { count: "exact", head: true }).eq("status", "OPEN").then((r) => ({ count: r.count ?? 0 })),
        db.from("evidence_items").select("*", { count: "exact", head: true }).then((r) => ({ count: r.count ?? 0 })),
        db.from("incidents").select("*", { count: "exact", head: true }).then((r) => ({ count: r.count ?? 0 })),
    ]);

    // Subscription tier breakdown
    const { data: tierBreakdown } = await db
        .from("organizations")
        .select("subscription_tier")
        .is("deleted_at", null);
    const tiers: Record<string, number> = {};
    (tierBreakdown ?? []).forEach((o: { subscription_tier: string | null }) => {
        const tier = o.subscription_tier ?? "free";
        tiers[tier] = (tiers[tier] ?? 0) + 1;
    });

    // Subscription plans for MRR calculation
    const { data: plans } = await db.from("subscription_plans").select("tier, price_monthly").eq("is_active", true);
    const planPrices: Record<string, number> = {};
    (plans ?? []).forEach((p: { tier: string; price_monthly: number }) => {
        planPrices[p.tier] = p.price_monthly;
    });

    // MRR = sum of (org count per tier × tier price)
    let mrrPence = 0;
    for (const [tier, count] of Object.entries(tiers)) {
        mrrPence += (planPrices[tier] ?? 0) * count;
    }
    const mrr = mrrPence / 100;

    // Active subscriptions
    const { data: activeSubs } = await db
        .from("subscriptions")
        .select("id, status")
        .eq("status", "active");
    const activeSubscriptions = activeSubs?.length ?? 0;

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentSignups } = await db
        .from("organizations")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentActivityCount } = await db
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo);

    // Recent organizations
    const { data: recentOrgs } = await db
        .from("organizations")
        .select("id, name, service_type, subscription_tier, subscription_status, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);

    // Recent audit logs
    const { data: recentLogs } = await db
        .from("audit_logs")
        .select("id, user_name, action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

    return apiSuccess({
        totals: {
            organizations: orgCount,
            activeOrganizations: activeOrgCount,
            users: userCount,
            staff: staffCount,
            policies: policyCount,
            tasks: taskCount,
            openTasks: openTaskCount,
            openGaps: gapCount,
            evidence: evidenceCount,
            incidents: incidentCount,
        },
        revenue: {
            mrr,
            activeSubscriptions,
            tierBreakdown: tiers,
            planPrices,
        },
        growth: {
            newOrgsLast30Days: recentSignups ?? 0,
            activityLast7Days: recentActivityCount ?? 0,
        },
        recentOrganizations: recentOrgs ?? [],
        recentActivity: recentLogs ?? [],
    });
});
