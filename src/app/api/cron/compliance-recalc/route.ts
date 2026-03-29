import { withPublic } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { ComplianceService } from '@/lib/services/compliance-service';
import { getDb } from '@/lib/db';

export const GET = withPublic(async (req, { params }) => {
  const client = await getDb();
  const rateCheck = checkRateLimit('cron', 'cron');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

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
});
