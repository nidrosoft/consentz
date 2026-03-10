import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { AIService } from '@/lib/services/ai-service';

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { domain, evidenceItems, serviceType } = body as {
    domain?: string;
    evidenceItems?: { title: string; category: string; status: string }[];
    serviceType?: string;
  };

  if (!domain) {
    return ApiErrors.badRequest('domain is required');
  }

  if (!evidenceItems?.length) {
    return ApiErrors.badRequest('At least one evidence item is required');
  }

  if (!serviceType) {
    return ApiErrors.badRequest('serviceType is required');
  }

  const result = await AIService.summarizeEvidence({ domain, evidenceItems, serviceType });
  return apiSuccess(result);
});
