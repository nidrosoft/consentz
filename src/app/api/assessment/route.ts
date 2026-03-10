import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AssessmentService } from '@/lib/services/assessment-service';
import { AuditService } from '@/lib/services/audit-service';
import { saveAssessmentSchema } from '@/lib/validations/assessment';
import { checkRateLimit } from '@/lib/rate-limiter';

export const GET = withAuth(async (req, { params, auth }) => {
  const assessment = await AssessmentService.getLatest(auth.organizationId);

  if (!assessment) {
    return ApiErrors.notFound('Assessment');
  }

  return apiSuccess(assessment);
});

export const POST = withAuth(async (req, { params, auth }) => {
  const rateCheck = checkRateLimit(auth.userId, 'assessment');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const validated = saveAssessmentSchema.parse(body);

  const assessment = await AssessmentService.saveAnswers({
    assessmentId: validated.assessmentId,
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    serviceType: validated.serviceType,
    currentStep: validated.currentStep,
    answers: validated.answers,
  });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'ASSESSMENT_SAVED',
    entityType: 'ORGANIZATION',
    entityId: assessment.id,
    description: `Assessment saved at step ${validated.currentStep}`,
  });

  return apiSuccess(assessment, undefined, 201);
});
