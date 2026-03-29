import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { stableAssessmentQuestionUuid, isUuidString } from '@/lib/assessment-question-stable-id';
import { AssessmentService } from '@/lib/services/assessment-service';
import { AuditService } from '@/lib/services/audit-service';
import { saveAssessmentSchema } from '@/lib/validations/assessment';
import { checkRateLimit } from '@/lib/rate-limiter';

function normalizeAssessmentPostBody(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const b = body as Record<string, unknown>;
  const st = b.serviceType;
  const answers = b.answers;
  if (typeof st !== 'string' || !Array.isArray(answers)) return body;
  return {
    ...b,
    answers: answers.map((a: unknown) => {
      if (!a || typeof a !== 'object' || Array.isArray(a)) return a;
      const row = a as Record<string, unknown>;
      const qid = row.questionId;
      if (typeof qid !== 'string' || isUuidString(qid)) return a;
      return {
        ...row,
        questionId: stableAssessmentQuestionUuid(qid, st),
      };
    }),
  };
}

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

  const body = normalizeAssessmentPostBody(await req.json());
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
