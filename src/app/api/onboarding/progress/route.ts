import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { getDb } from '@/lib/db';

const VALID_STEP_KEYS = [
  'org_profile', 'connect_consentz', 'upload_evidence',
  'add_staff', 'review_domains',
] as const;

type StepKey = typeof VALID_STEP_KEYS[number];

/**
 * Infer which onboarding steps are already complete by querying real data.
 * Merged with explicit markers so steps never regress to "incomplete".
 */
async function inferCompletedSteps(
  client: Awaited<ReturnType<typeof getDb>>,
  organizationId: string,
): Promise<Set<StepKey>> {
  const completed = new Set<StepKey>();

  const [orgResult, evidenceResult, staffResult, scoresResult] = await Promise.all([
    client
      .from('organizations')
      .select('name, cqc_provider_id, cqc_location_id, registered_manager, consentz_clinic_id')
      .eq('id', organizationId)
      .maybeSingle(),
    client
      .from('evidence_items')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    client
      .from('staff_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true),
    client
      .from('compliance_scores')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
  ]);

  const org = orgResult.data;

  if (org?.name && (org.cqc_provider_id || org.cqc_location_id || org.registered_manager)) {
    completed.add('org_profile');
  }

  if (org?.consentz_clinic_id) {
    completed.add('connect_consentz');
  }

  if ((evidenceResult.count ?? 0) > 0) {
    completed.add('upload_evidence');
  }

  if ((staffResult.count ?? 0) > 0) {
    completed.add('add_staff');
  }

  if ((scoresResult.count ?? 0) > 0) {
    completed.add('review_domains');
  }

  return completed;
}

export const GET = withAuth(async (_req, { auth }) => {
  const client = await getDb();

  const [explicitResult, inferred] = await Promise.all([
    client.from('onboarding_progress')
      .select('step_key, completed_at')
      .eq('user_id', auth.userId)
      .eq('organization_id', auth.organizationId),
    inferCompletedSteps(client, auth.organizationId),
  ]);

  const explicitSteps = explicitResult.data ?? [];
  const explicitKeys = new Set(explicitSteps.map((s) => s.step_key));

  const now = new Date().toISOString();
  const steps = VALID_STEP_KEYS.map((key) => {
    const explicit = explicitSteps.find((s) => s.step_key === key);
    if (explicit) return explicit;
    if (inferred.has(key)) return { step_key: key, completed_at: now };
    return null;
  }).filter(Boolean);

  // Back-fill: write inferred completions that aren't explicitly stored yet
  const toBackfill = [...inferred].filter((key) => !explicitKeys.has(key));
  if (toBackfill.length > 0) {
    const rows = toBackfill.map((key) => ({
      user_id: auth.userId,
      organization_id: auth.organizationId,
      step_key: key,
      completed_at: now,
    }));
    client
      .from('onboarding_progress')
      .upsert(rows, { onConflict: 'user_id,step_key' })
      .then(() => {});
  }

  return apiSuccess({ steps });
});

export const POST = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const { stepKey } = body as { stepKey: string };
  if (!stepKey || !VALID_STEP_KEYS.includes(stepKey as StepKey)) {
    return apiSuccess({ ok: false });
  }

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
