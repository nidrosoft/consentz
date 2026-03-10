import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { AIService } from '@/lib/services/ai-service';

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { gaps, serviceType } = body as {
    gaps?: { title: string; domain: string; severity: string; kloeCode?: string }[];
    serviceType?: string;
  };

  if (!gaps?.length) {
    return ApiErrors.badRequest('At least one gap is required');
  }

  if (!serviceType) {
    return ApiErrors.badRequest('serviceType is required');
  }

  const result = await AIService.analyzeGaps({ gaps, serviceType });
  return apiSuccess(result);
});
