import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { AssessmentService } from '@/lib/services/assessment-service';
import { AuditService } from '@/lib/services/audit-service';
import { calculateAssessmentSchema } from '@/lib/validations/assessment';
import { checkRateLimit } from '@/lib/rate-limiter';

export const POST = withAuth(async (req, { params, auth }) => {
  const rateCheck = checkRateLimit(auth.userId, 'assessment');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const validated = calculateAssessmentSchema.parse(body);

  const result = await AssessmentService.calculate({
    assessmentId: validated.assessmentId,
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
  });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'ASSESSMENT_CALCULATED',
    entityType: 'ORGANIZATION',
    entityId: validated.assessmentId,
    description: `Assessment calculated — overall score: ${result.overallScore}%`,
  });

  return apiSuccess(result);
});
