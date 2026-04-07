import { withAuth } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { EvidenceFileService } from '@/lib/services/evidence-file-service';
import { EvidenceStatusService } from '@/lib/services/evidence-status-service';
import { recalculateComplianceScores } from '@/lib/services/score-engine';
import { generateEvidenceStatusGaps } from '@/lib/services/gap-generator';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { auth }) => {
  const url = new URL(req.url);
  const evidenceItemId = url.searchParams.get('evidenceItemId');
  const kloeCode = url.searchParams.get('kloeCode');

  if (evidenceItemId) {
    const versions = await EvidenceFileService.getVersions(auth.organizationId, evidenceItemId);
    return apiSuccess(versions);
  }

  const versions = await EvidenceFileService.getVersionsForKloe(
    auth.organizationId,
    kloeCode ?? undefined,
  );
  return apiSuccess(versions);
});

export const POST = withAuth(async (req, { auth }) => {
  const body = await req.json();
  const { evidenceItemId, kloeCode, fileUrl, fileName, fileType, expiresAt } = body;

  if (!evidenceItemId || !kloeCode || !fileUrl || !fileName) {
    return apiError('BAD_REQUEST', 'evidenceItemId, kloeCode, fileUrl, and fileName are required');
  }

  const version = await EvidenceFileService.addVersion({
    organizationId: auth.organizationId,
    evidenceItemId,
    kloeCode,
    fileUrl,
    fileName,
    fileType: fileType ?? 'application/octet-stream',
    uploadedBy: auth.userId,
    expiresAt: expiresAt ?? null,
  });

  // Mark the evidence item as complete and propagate expiry date
  await EvidenceStatusService.updateStatus(auth.organizationId, evidenceItemId, {
    status: 'complete',
    linkedEvidenceId: version.id,
  });
  if (expiresAt) {
    await EvidenceStatusService.setExpiryDate(auth.organizationId, evidenceItemId, expiresAt);
  }
  await EvidenceStatusService.setLastActivity(auth.organizationId, evidenceItemId);

  // Recalculate compliance scores and regenerate evidence-status gaps
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

  return apiSuccess(version, undefined, 201);
});
