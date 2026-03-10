import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { GapService } from '@/lib/services/gap-service';
import { ComplianceService } from '@/lib/services/compliance-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateGapSchema } from '@/lib/validations/gap';

export const GET = withAuth(async (req, { params, auth }) => {
  const gap = await GapService.getById(params.id, auth.organizationId);

  if (!gap) {
    return ApiErrors.notFound('Gap');
  }

  return apiSuccess(gap);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const existing = await GapService.getById(params.id, auth.organizationId);
  if (!existing) {
    return ApiErrors.notFound('Gap');
  }

  const body = await req.json();
  const validated = updateGapSchema.parse(body);

  const updated = await GapService.update({
    gapId: params.id,
    organizationId: auth.organizationId,
    status: validated.status,
    resolutionNotes: validated.resolutionNotes,
    dueDate: validated.dueDate ?? undefined,
  });

  if (!updated) {
    return ApiErrors.notFound('Gap');
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'GAP_STATUS_CHANGED',
    entityType: 'GAP',
    entityId: params.id,
    description: `Gap "${existing.title}" status changed to ${validated.status}`,
  });

  // Trigger recalculation if gap was resolved
  if (validated.status === 'RESOLVED') {
    ComplianceService.queueRecalculation(auth.organizationId);
  }

  return apiSuccess(updated);
});
