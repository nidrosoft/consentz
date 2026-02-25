import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { AssessmentService } from '@/lib/services/assessment-service';

export const GET = withAuth(async (req, { params, auth }) => {
  const assessment = AssessmentService.getById(params.id);

  if (!assessment) {
    return ApiErrors.notFound('Assessment');
  }

  return apiSuccess(assessment);
});
