import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async () => {
    const db = await getDb();

    // All subscription plans
    const { data: plans } = await db
        .from("subscription_plans")
        .select("id, name, tier, price_monthly, price_yearly, price_currency, is_active, stripe_price_id")
        .order("price_monthly");

    // All active subscriptions with org info
    const { data: subscriptions } = await db
        .from("subscriptions")
        .select("id, organization_id, plan_id, status, stripe_subscription_id, current_period_start, current_period_end, cancel_at, created_at");

    // All orgs with their subscription data
    const { data: orgs } = await db
        .from("organizations")
        .select("id, name, subscription_tier, subscription_status, stripe_customer_id, trial_ends_at, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    // Build plan lookup
    const planMap: Record<string, { name: string; tier: string; price_monthly: number }> = {};
    (plans ?? []).forEach((p: Record<string, unknown>) => {
        planMap[p.id as string] = { name: p.name as string, tier: p.tier as string, price_monthly: p.price_monthly as number };
    });

    // Enrich subscriptions with plan and org info
    const orgMap: Record<string, string> = {};
    (orgs ?? []).forEach((o: Record<string, unknown>) => {
        orgMap[o.id as string] = o.name as string;
    });

    const enrichedSubs = (subscriptions ?? []).map((s: Record<string, unknown>) => ({
        ...s,
        organizationName: orgMap[s.organization_id as string] ?? "Unknown",
        planName: planMap[s.plan_id as string]?.name ?? "Unknown",
        planTier: planMap[s.plan_id as string]?.tier ?? "free",
        priceMonthly: (planMap[s.plan_id as string]?.price_monthly ?? 0) / 100,
    }));

    // Tier breakdown for orgs
    const tierCounts: Record<string, number> = {};
    const tierRevenue: Record<string, number> = {};
    (orgs ?? []).forEach((o: Record<string, unknown>) => {
        const tier = (o.subscription_tier as string) ?? "free";
        tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
        const planPrice = (plans ?? []).find((p: Record<string, unknown>) => p.tier === tier);
        tierRevenue[tier] = (tierRevenue[tier] ?? 0) + ((planPrice as Record<string, unknown>)?.price_monthly as number ?? 0) / 100;
    });

    // Orgs on trial
    const now = new Date();
    const trialing = (orgs ?? []).filter((o: Record<string, unknown>) => o.trial_ends_at && new Date(o.trial_ends_at as string) > now);

    // Past due / failed
    const pastDue = (orgs ?? []).filter((o: Record<string, unknown>) => o.subscription_status === "past_due");
    const canceled = (orgs ?? []).filter((o: Record<string, unknown>) => o.subscription_status === "canceled");

    return apiSuccess({
        plans: plans ?? [],
        subscriptions: enrichedSubs,
        organizations: orgs ?? [],
        summary: {
            tierCounts,
            tierRevenue,
            totalMrr: Object.values(tierRevenue).reduce((a, b) => a + b, 0),
            activeSubscriptions: enrichedSubs.filter((s: Record<string, unknown>) => s.status === "active").length,
            trialingCount: trialing.length,
            pastDueCount: pastDue.length,
            canceledCount: canceled.length,
        },
    });
});
