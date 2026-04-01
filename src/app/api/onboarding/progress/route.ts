import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (_req, { auth }) => {
  const client = await getDb();
  const { data: steps } = await client.from('onboarding_progress')
    .select('step_key, completed_at')
    .eq('user_id', auth.userId)
    .eq('organization_id', auth.organizationId);

  return apiSuccess({ steps: steps ?? [] });
});

export const POST = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const { stepKey } = body as { stepKey: string };
  if (!stepKey) return apiSuccess({ ok: false });

  const client = await getDb();
  await client.from('onboarding_progress')
    .upsert({
      user_id: auth.userId,
      organization_id: auth.organizationId,
      step_key: stepKey,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,step_key' });

  return apiSuccess({ ok: true, stepKey });
});
