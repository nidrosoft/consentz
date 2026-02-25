import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AIService } from '@/lib/services/ai-service';
import { checkRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

const suggestionsSchema = z.object({
  domain: z.string().optional(),
  currentScore: z.number().optional(),
  context: z.string().max(2000).optional(),
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const rateCheck = checkRateLimit(auth.userId, 'aiGeneration');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const validated = suggestionsSchema.parse(body);

  const recommendations = await AIService.generateRecommendations({
    organizationId: auth.organizationId,
    domain: validated.domain,
    currentScore: validated.currentScore,
  });

  return apiSuccess(recommendations);
});
