import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AIService } from '@/lib/services/ai-service';
import { checkRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationHistory: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      }),
    )
    .max(50)
    .optional(),
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const rateCheck = checkRateLimit(auth.userId, 'aiGeneration');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const validated = chatSchema.parse(body);

  const result = await AIService.complianceChat({
    organizationId: auth.organizationId,
    message: validated.message,
    conversationHistory: validated.conversationHistory,
  });

  return apiSuccess(result);
});
