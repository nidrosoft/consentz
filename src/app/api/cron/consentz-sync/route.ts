import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-response';
import { verifyCronSecret } from '@/lib/cron-auth';
import { syncConsentzData } from '@/lib/consentz/sync-service';
import { recalculateComplianceScores } from '@/lib/services/score-engine';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  const client = await getDb();

  const { data: orgs } = await client.from('organizations')
    .select('id, name, consentz_clinic_id')
    .not('consentz_clinic_id', 'is', null);

  const results: { organizationId: string; name: string; status: string; error?: string }[] = [];

  for (const org of orgs ?? []) {
    try {
      await syncConsentzData(org.id);
      await recalculateComplianceScores(org.id);
      results.push({ organizationId: org.id, name: org.name, status: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[CRON] Consentz sync failed for org ${org.id}:`, message);
      results.push({ organizationId: org.id, name: org.name, status: 'error' });
    }
  }

  return apiSuccess({
    synced: true,
    totalOrganizations: (orgs ?? []).length,
    results,
  });
}
