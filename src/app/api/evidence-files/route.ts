import { withAuth } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { EvidenceFileService } from '@/lib/services/evidence-file-service';
import { EvidenceStatusService } from '@/lib/services/evidence-status-service';
import { recalculateComplianceScores } from '@/lib/services/score-engine';
import { generateEvidenceStatusGaps } from '@/lib/services/gap-generator';
import { verifyEvidenceFile } from '@/lib/services/evidence-verification-service';
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

  const resolvedFileType = fileType ?? 'application/octet-stream';

  const version = await EvidenceFileService.addVersion({
    organizationId: auth.organizationId,
    evidenceItemId,
    kloeCode,
    fileUrl,
    fileName,
    fileType: resolvedFileType,
    uploadedBy: auth.dbUserId,
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

  // Fire-and-forget AI verification. We don't await so the upload response
  // returns immediately; the UI polls evidence-files to pick up the result
  // once Claude finishes (typically 10-30s). On completion the service writes
  // `verification_status` + `verification_result` directly to
  // `evidence_file_versions`, and the next compliance recalc run will fold
  // the graduated complianceScore into the KLOE score.
  queueMicrotask(async () => {
    try {
      await verifyEvidenceFile({
        organizationId: auth.organizationId,
        evidenceItemId,
        fileVersionId: version.id,
        kloeCode,
        evidenceRequirementId: evidenceItemId,
        // documentCategory intentionally omitted — service derives it from
        // the requirement's sourceLabel.
        fileName,
        fileUrl,
        fileType: resolvedFileType,
      });
      // Trigger a second recalc now the AI score is in, so the tile reflects
      // the graduated multiplier without requiring another user action.
      await recalculateComplianceScores(auth.organizationId);
    } catch (err) {
      console.error('[evidence-files] Auto-verify failed:', err);
    }
  });

  return apiSuccess(version, undefined, 201);
});

export const DELETE = withAuth(async (req, { auth }) => {
  const url = new URL(req.url);
  const versionId = url.searchParams.get('id');

  if (!versionId) {
    return apiError('BAD_REQUEST', 'id query parameter is required');
  }

  const result = await EvidenceFileService.deleteVersion(auth.organizationId, versionId);
  if (!result.deleted) {
    return apiError('NOT_FOUND', 'Evidence file version not found', 404);
  }

  // If there are no remaining file versions for this evidence item, reset status to not_started
  if (result.evidenceItemId) {
    const remaining = await EvidenceFileService.getVersions(auth.organizationId, result.evidenceItemId);
    if (remaining.length === 0) {
      await EvidenceStatusService.updateStatus(auth.organizationId, result.evidenceItemId, {
        status: 'not_started',
        linkedEvidenceId: null,
      });
    }

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
  }

  return apiSuccess({ deleted: true });
});
