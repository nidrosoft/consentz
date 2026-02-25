import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { EvidenceService } from '@/lib/services/evidence-service';
import { ComplianceService } from '@/lib/services/compliance-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateEvidenceSchema } from '@/lib/validations/evidence';

export const GET = withAuth(async (req, { params, auth }) => {
  const evidence = EvidenceService.getById(params.id);

  if (!evidence) {
    return ApiErrors.notFound('Evidence');
  }

  return apiSuccess(evidence);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'STAFF');

  const existing = EvidenceService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Evidence');
  }

  const body = await req.json();
  const validated = updateEvidenceSchema.parse(body);

  const updated = EvidenceService.update({
    id: params.id,
    name: validated.name,
    expiresAt: validated.validUntil,
    linkedKloes: validated.linkedKloes,
  });

  if (!updated) {
    return ApiErrors.notFound('Evidence');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'EVIDENCE_UPDATED',
    entityType: 'EVIDENCE',
    entityId: params.id,
    description: `Updated evidence: ${existing.name}`,
  });

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = EvidenceService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Evidence');
  }

  const deleted = EvidenceService.softDelete(params.id);
  if (!deleted) {
    return ApiErrors.notFound('Evidence');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'EVIDENCE_DELETED',
    entityType: 'EVIDENCE',
    entityId: params.id,
    description: `Deleted evidence: ${existing.name}`,
  });

  ComplianceService.queueRecalculation(auth.organizationId);

  return apiSuccess({ deleted: true });
});
