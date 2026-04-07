import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-response';
import { verifyCronSecret } from '@/lib/cron-auth';
import { ComplianceService } from '@/lib/services/compliance-service';
import { generateEvidenceStatusGaps } from '@/lib/services/gap-generator';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  const client = await getDb();

  const { data: orgs } = await client.from('organizations').select('id, service_type');
  const results: Record<string, unknown>[] = [];

  for (const org of orgs ?? []) {
    // Generate evidence-status gaps first (missing evidence, expired, Consentz not synced)
    // then recalculate scores so the latest gap state is reflected.
    await generateEvidenceStatusGaps({
      organizationId: org.id,
      serviceType: org.service_type ?? 'AESTHETIC_CLINIC',
    });
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
