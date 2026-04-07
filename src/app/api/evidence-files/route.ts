import { withAuth } from '@/lib/api-handler';
import { apiSuccess, apiError } from '@/lib/api-response';
import { EvidenceFileService } from '@/lib/services/evidence-file-service';

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

  return apiSuccess(version, undefined, 201);
});
