import { withPublic } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { ApiErrors } from '@/lib/api-response';
import { syncConsentzData } from '@/lib/consentz/sync-service';
import { getDb } from '@/lib/db';

export const GET = withPublic(async () => {
  const client = await getDb();
  const rateCheck = checkRateLimit('cron', 'cron');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const { data: orgs } = await client.from('organizations')
    .select('id, name, consentz_clinic_id')
    .not('consentz_clinic_id', 'is', null);

  const results: { organizationId: string; name: string; status: string; error?: string }[] = [];

  for (const org of orgs ?? []) {
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
    totalOrganizations: (orgs ?? []).length,
    results,
  });
});
