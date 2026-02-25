import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { PolicyService } from '@/lib/services/policy-service';
import { AuditService } from '@/lib/services/audit-service';

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = PolicyService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Policy');
  }

  if (existing.status !== 'REVIEW' && existing.status !== 'DRAFT') {
    return ApiErrors.badRequest(
      `Cannot approve a policy with status "${existing.status}". Only DRAFT or REVIEW policies can be approved.`,
    );
  }

  const approved = PolicyService.approve(params.id);
  if (!approved) {
    return ApiErrors.notFound('Policy');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_APPROVED',
    entityType: 'POLICY',
    entityId: params.id,
    description: `Approved policy: ${existing.title}`,
  });

  return apiSuccess(approved);
});
