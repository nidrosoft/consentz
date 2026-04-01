import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { AIService } from '@/lib/services/ai-service';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getDb } from '@/lib/db';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  history: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      }),
    )
    .max(50)
    .optional(),
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

export const POST = withAuth(async (req, { auth }) => {
  const rateCheck = checkRateLimit(auth.userId, 'aiGeneration');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const body = await req.json();
  const validated = chatSchema.parse(body);
  const history = validated.conversationHistory ?? validated.history;

  const dbClient = await getDb();

  const [complianceData, syncData] = await Promise.all([
    dbClient.from('compliance_scores')
      .select('score, predicted_rating')
      .eq('organization_id', auth.organizationId)
      .maybeSingle(),
    dbClient.from('consentz_sync_logs')
      .select('endpoint, response_data, synced_at')
      .eq('organization_id', auth.organizationId)
      .eq('status', 'success')
      .order('synced_at', { ascending: false })
      .limit(6),
  ]);

  const orgContext = [
    complianceData.data
      ? `Organisation compliance score: ${Math.round(complianceData.data.score)}%, predicted rating: ${complianceData.data.predicted_rating}.`
      : '',
    syncData.data?.length
      ? `Recent Consentz sync data available for: ${syncData.data.map(l => l.endpoint).join(', ')}.`
      : 'No Consentz data synced yet.',
  ].filter(Boolean).join(' ');

  const result = await AIService.complianceChat({
    organizationId: auth.organizationId,
    message: validated.message,
    conversationHistory: history,
    orgContext,
  });

  await dbClient.from('chat_messages').insert([
    {
      organization_id: auth.organizationId,
      user_id: auth.userId,
      role: 'user',
      content: validated.message,
    },
    {
      organization_id: auth.organizationId,
      user_id: auth.userId,
      role: 'assistant',
      content: result.message,
    },
  ]);

  return apiSuccess({ response: result.message, sources: result.sources });
});
