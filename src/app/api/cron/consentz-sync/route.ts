import { withPublic } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { ApiErrors } from '@/lib/api-response';
import { syncConsentzData } from '@/lib/consentz/sync-service';
import { db } from '@/lib/db';

export const GET = withPublic(async () => {
  const rateCheck = checkRateLimit('cron', 'cron');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const orgs = await db.organization.findMany({
    where: { consentzClinicId: { not: null } },
    select: { id: true, name: true, consentzClinicId: true },
  });

  const results: { organizationId: string; name: string; status: string; error?: string }[] = [];

  for (const org of orgs) {
    try {
      await syncConsentzData(org.id);
      results.push({ organizationId: org.id, name: org.name, status: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[CRON] Consentz sync failed for org ${org.id}:`, message);
      results.push({ organizationId: org.id, name: org.name, status: 'error', error: message });
    }
  }

  return apiSuccess({
    synced: true,
    totalOrganizations: orgs.length,
    results,
  });
});
