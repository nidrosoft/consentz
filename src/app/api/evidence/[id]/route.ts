import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { EvidenceService } from '@/lib/services/evidence-service';
import { ComplianceService } from '@/lib/services/compliance-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateEvidenceSchema } from '@/lib/validations/evidence';

export const GET = withAuth(async (req, { params, auth }) => {
  const evidence = await EvidenceService.getById(params.id);

  if (!evidence) {
    return ApiErrors.notFound('Evidence');
  }

  return apiSuccess(evidence);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'STAFF');

  const existing = await EvidenceService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Evidence');
  }

  const body = await req.json();
  const validated = updateEvidenceSchema.parse(body);

  const updated = await EvidenceService.update(params.id, {
    name: validated.name,
    expiresAt: validated.validUntil,
    linkedKloes: validated.linkedKloes,
  });

  if (!updated) {
    return ApiErrors.notFound('Evidence');
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'EVIDENCE_UPDATED',
    entityType: 'EVIDENCE',
    entityId: params.id,
    description: `Updated evidence: ${existing.title}`,
  });

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = await EvidenceService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Evidence');
  }

  const deleted = await EvidenceService.softDelete(params.id);
  if (!deleted) {
    return ApiErrors.notFound('Evidence');
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'EVIDENCE_DELETED',
    entityType: 'EVIDENCE',
    entityId: params.id,
    description: `Deleted evidence: ${existing.title}`,
  });

  ComplianceService.queueRecalculation(auth.organizationId);

  return apiSuccess({ deleted: true });
});
