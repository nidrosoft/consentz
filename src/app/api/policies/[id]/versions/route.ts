import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { PolicyService } from '@/lib/services/policy-service';

export const GET = withAuth(async (req, { params, auth }) => {
  const policy = await PolicyService.getById(params.id);
  if (!policy) {
    return ApiErrors.notFound('Policy');
  }

  const versions = await PolicyService.getVersionHistory(params.id);
  return apiSuccess(versions);
});
