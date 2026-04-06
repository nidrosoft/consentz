import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-response';
import { verifyCronSecret } from '@/lib/cron-auth';
import { ComplianceService } from '@/lib/services/compliance-service';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  const client = await getDb();

  const { data: orgs } = await client.from('organizations').select('id');
  const results: Record<string, unknown>[] = [];

  for (const org of orgs ?? []) {
    const updatedScore = await ComplianceService.recalculate(org.id);
    results.push({
      organizationId: org.id,
      overall: updatedScore.overall,
      predictedRating: updatedScore.predictedRating,
    });
  }

  return apiSuccess({
    recalculated: true,
    organizations: results,
  });
}
