import { withAuth } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { isKnownEvidenceItemId } from '@/lib/constants/cqc-evidence-requirements';
import { EvidenceStatusService } from '@/lib/services/evidence-status-service';
import { recalculateComplianceScores } from '@/lib/services/score-engine';
import { generateEvidenceStatusGaps } from '@/lib/services/gap-generator';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { auth }) => {
  const { searchParams } = new URL(req.url);
  const kloeCode = searchParams.get('kloe');

  if (kloeCode) {
    const items = await EvidenceStatusService.getForKloe(auth.organizationId, kloeCode.toUpperCase());
    return apiSuccess(items);
  }

  const items = await EvidenceStatusService.getForOrganization(auth.organizationId);
  return apiSuccess(items);
});

export const POST = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const { action } = body as { action?: string };

  if (action === 'seed') {
    const { serviceType } = body as { serviceType?: string };
    if (!serviceType || !['AESTHETIC_CLINIC', 'CARE_HOME'].includes(serviceType)) {
      return apiError('BAD_REQUEST', 'Valid serviceType required (AESTHETIC_CLINIC or CARE_HOME)');
    }
    const items = await EvidenceStatusService.seedForOrganization(
      auth.organizationId,
      serviceType as 'AESTHETIC_CLINIC' | 'CARE_HOME',
    );
    return apiSuccess(items, undefined, 201);
  }

  return apiError('BAD_REQUEST', 'Unknown action. Supported: seed');
});

export const PATCH = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const { evidenceItemId, status, linkedPolicyId, linkedEvidenceId, notes } = body as {
    evidenceItemId?: string;
    status?: string;
    linkedPolicyId?: string;
    linkedEvidenceId?: string;
    notes?: string;
  };

  if (!evidenceItemId) {
    return apiError('BAD_REQUEST', 'evidenceItemId is required');
  }

  if (!isKnownEvidenceItemId(evidenceItemId)) {
    return apiError('BAD_REQUEST', 'evidenceItemId is not a valid evidence item');
  }

  const validStatuses = ['not_started', 'in_progress', 'complete'];
  if (status && !validStatuses.includes(status)) {
    return apiError('BAD_REQUEST', `status must be one of: ${validStatuses.join(', ')}`);
  }

  const updated = await EvidenceStatusService.updateStatus(auth.organizationId, evidenceItemId, {
    status: status as 'not_started' | 'in_progress' | 'complete' | undefined,
    linkedPolicyId,
    linkedEvidenceId,
    notes,
  });

  if (!updated) {
    return apiError('NOT_FOUND', 'Evidence status record not found. Have you seeded evidence items?', 404);
  }

  // Recalculate compliance scores and regenerate evidence-status gaps
  // so the dashboard reflects the latest evidence state immediately.
  const client = await getDb();
  const { data: org } = await client
    .from('organizations')
    .select('service_type')
    .eq('id', auth.organizationId)
    .maybeSingle();
  const serviceType = org?.service_type ?? 'AESTHETIC_CLINIC';

  await Promise.all([
    recalculateComplianceScores(auth.organizationId),
    generateEvidenceStatusGaps({ organizationId: auth.organizationId, serviceType }),
  ]);

  return apiSuccess(updated);
});
