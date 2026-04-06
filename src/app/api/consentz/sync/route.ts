import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { syncConsentzData } from '@/lib/consentz/sync-service';
import { recalculateComplianceScores } from '@/lib/services/score-engine';
import { EvidenceStatusService } from '@/lib/services/evidence-status-service';
import { getDb } from '@/lib/db';

export const POST = withAuth(async (_req, { auth }) => {
  const client = await getDb();
  const { data: org } = await client.from('organizations')
    .select('consentz_clinic_id')
    .eq('id', auth.organizationId)
    .single();

  if (!org?.consentz_clinic_id) {
    return ApiErrors.badRequest('Consentz integration not configured');
  }

  await syncConsentzData(auth.organizationId);

  const { data: orgFull } = await client.from('organizations')
    .select('service_type')
    .eq('id', auth.organizationId)
    .single();
  const serviceType = orgFull?.service_type === 'CARE_HOME' ? 'CARE_HOME' as const : 'AESTHETIC_CLINIC' as const;
  EvidenceStatusService.markConsentzItemsSynced(auth.organizationId, serviceType).catch(() => {});

  const scores = await recalculateComplianceScores(auth.organizationId);

  return apiSuccess({ synced: true, organizationId: auth.organizationId, scores });
});
