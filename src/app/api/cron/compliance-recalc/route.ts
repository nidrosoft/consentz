import { withPublic } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { ComplianceService } from '@/lib/services/compliance-service';

export const GET = withPublic(async (req, { params }) => {
  const rateCheck = checkRateLimit('cron', 'cron');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const previousScore = ComplianceService.getCurrentScore('org-1');
  const updatedScore = ComplianceService.recalculate('org-1');

  return apiSuccess({
    recalculated: true,
    previousOverall: previousScore.overall,
    currentOverall: updatedScore.overall,
    predictedRating: updatedScore.predictedRating,
    lastUpdated: updatedScore.lastUpdated,
  });
});
