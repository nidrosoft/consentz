import { withAdmin } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getDb } from "@/lib/db";

export const GET = withAdmin(async () => {
    const db = await getDb();

    const { data: orgs } = await db
        .from("organizations")
        .select("id, name, consentz_clinic_id, service_type")
        .is("deleted_at", null)
        .not("consentz_clinic_id", "is", null);

    const connected = orgs?.length ?? 0;

    const { data: syncLogs } = await db
        .from("consentz_sync_logs")
        .select("id, organization_id, endpoint, synced_at, record_count, status, error_message")
        .order("synced_at", { ascending: false })
        .limit(200);

    const sixHoursAgo = new Date(Date.now() - 6 * 3600000);
    const twelveHoursAgo = new Date(Date.now() - 12 * 3600000);

    const latestByOrg: Record<string, Record<string, unknown>> = {};
    for (const log of (syncLogs ?? []) as Record<string, unknown>[]) {
        const oid = log.organization_id as string;
        if (!latestByOrg[oid]) latestByOrg[oid] = log;
    }

    let healthy = 0, stale = 0, failed = 0;
    for (const log of Object.values(latestByOrg)) {
        if (log.status === "failed" || log.status === "error") { failed++; continue; }
        const syncedAt = new Date(log.synced_at as string);
        if (syncedAt > sixHoursAgo) healthy++;
        else if (syncedAt < twelveHoursAgo) stale++;
        else healthy++;
    }

    const orgMap = Object.fromEntries((orgs ?? []).map((o: Record<string, unknown>) => [o.id as string, o]));

    const syncTable = Object.entries(latestByOrg).map(([orgId, log]) => ({
        organizationId: orgId,
        organizationName: (orgMap[orgId]?.name as string) ?? "Unknown",
        serviceType: (orgMap[orgId]?.service_type as string) ?? null,
        lastSync: log.synced_at,
        status: log.status,
        recordsSynced: log.record_count ?? 0,
        error: log.error_message ?? null,
    }));

    // Also include connected orgs with NO sync logs
    for (const org of (orgs ?? []) as Record<string, unknown>[]) {
        const oid = org.id as string;
        if (!latestByOrg[oid]) {
            syncTable.push({
                organizationId: oid,
                organizationName: (org.name as string) ?? "Unknown",
                serviceType: (org.service_type as string) ?? null,
                lastSync: null as unknown as string,
                status: "never_synced",
                recordsSynced: 0,
                error: null,
            });
        }
    }

    return apiSuccess({
        summary: { connected, healthy, stale, failed },
        syncJobs: syncTable,
    });
});
