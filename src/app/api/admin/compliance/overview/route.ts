import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async () => {
    const db = await getDb();

    const { data: scores } = await db
        .from("compliance_scores")
        .select("organization_id, domain_code, score, calculated_at");

    const { data: orgs } = await db
        .from("organizations")
        .select("id, name, service_type")
        .is("deleted_at", null);

    const orgMap = Object.fromEntries((orgs ?? []).map((o: Record<string, unknown>) => [o.id, o]));

    // Group scores by org, compute per-org overall average and per-domain scores
    const orgScores: Record<string, Record<string, number>> = {};
    for (const s of (scores ?? []) as Record<string, unknown>[]) {
        const oid = s.organization_id as string;
        const domain = (s.domain_code as string) ?? "unknown";
        if (!orgScores[oid]) orgScores[oid] = {};
        orgScores[oid][domain] = s.score as number;
    }

    // Compute per-org overall score (average of all domain scores)
    const orgOverallScores: Array<{ orgId: string; overall: number; domains: Record<string, number> }> = [];
    for (const [orgId, domains] of Object.entries(orgScores)) {
        const vals = Object.values(domains);
        const overall = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
        orgOverallScores.push({ orgId, overall, domains });
    }

    const avgScore = orgOverallScores.length > 0
        ? Math.round(orgOverallScores.reduce((sum, o) => sum + o.overall, 0) / orgOverallScores.length)
        : 0;

    // Platform-wide domain averages
    const domainTotals: Record<string, { sum: number; count: number }> = {};
    for (const s of (scores ?? []) as Record<string, unknown>[]) {
        const domain = (s.domain_code as string) ?? "unknown";
        if (!domainTotals[domain]) domainTotals[domain] = { sum: 0, count: 0 };
        domainTotals[domain].sum += (s.score as number) ?? 0;
        domainTotals[domain].count += 1;
    }

    const domainAvg = {
        safe: Math.round((domainTotals["safe"]?.sum ?? 0) / Math.max(domainTotals["safe"]?.count ?? 1, 1)),
        effective: Math.round((domainTotals["effective"]?.sum ?? 0) / Math.max(domainTotals["effective"]?.count ?? 1, 1)),
        caring: Math.round((domainTotals["caring"]?.sum ?? 0) / Math.max(domainTotals["caring"]?.count ?? 1, 1)),
        responsive: Math.round((domainTotals["responsive"]?.sum ?? 0) / Math.max(domainTotals["responsive"]?.count ?? 1, 1)),
        wellLed: Math.round((domainTotals["well_led"]?.sum ?? domainTotals["well-led"]?.sum ?? 0) / Math.max(domainTotals["well_led"]?.count ?? domainTotals["well-led"]?.count ?? 1, 1)),
    };

    const outstanding = orgOverallScores.filter((o) => o.overall >= 90).length;
    const requiresImprovement = orgOverallScores.filter((o) => o.overall < 50).length;

    const { count: totalGaps } = await db.from("compliance_gaps").select("*", { count: "exact", head: true }).eq("status", "OPEN");
    const { count: overdueTasks } = await db.from("tasks").select("*", { count: "exact", head: true }).in("status", ["TODO", "IN_PROGRESS"]).lt("due_date", new Date().toISOString());

    // Distribution bands
    const bands = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
    for (const o of orgOverallScores) {
        if (o.overall <= 25) bands["0-25"]++;
        else if (o.overall <= 50) bands["26-50"]++;
        else if (o.overall <= 75) bands["51-75"]++;
        else bands["76-100"]++;
    }

    // Bottom 10
    const bottom10 = orgOverallScores
        .sort((a, b) => a.overall - b.overall)
        .slice(0, 10)
        .map((o) => {
            const org = orgMap[o.orgId] as Record<string, unknown> | undefined;
            return {
                id: o.orgId,
                name: (org?.name as string) ?? "Unknown",
                serviceType: (org?.service_type as string) ?? null,
                score: o.overall,
            };
        });

    return apiSuccess({
        averageScore: avgScore,
        domainAverages: domainAvg,
        outstanding,
        requiresImprovement,
        totalOpenGaps: totalGaps ?? 0,
        overdueTasks: overdueTasks ?? 0,
        scoreBands: bands,
        bottom10,
    });
});
