import { withPublic } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { ComplianceService } from '@/lib/services/compliance-service';
import { db } from '@/lib/db';

export const GET = withPublic(async (req, { params }) => {
  const rateCheck = checkRateLimit('cron', 'cron');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const orgs = await db.organization.findMany({ select: { id: true } });
  const results: Record<string, unknown>[] = [];

  for (const org of orgs) {
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
