import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { PolicyService } from '@/lib/services/policy-service';
import { ComplianceService } from '@/lib/services/compliance-service';
import { AuditService } from '@/lib/services/audit-service';

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = PolicyService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Policy');
  }

  if (existing.status !== 'APPROVED') {
    return ApiErrors.badRequest(
      `Cannot publish a policy with status "${existing.status}". Only APPROVED policies can be published.`,
    );
  }

  const published = PolicyService.publish(params.id, auth.dbUserId);
  if (!published) {
    return ApiErrors.notFound('Policy');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_PUBLISHED',
    entityType: 'POLICY',
    entityId: params.id,
    description: `Published policy: ${existing.title}`,
  });

  // Trigger compliance recalculation after publishing
  ComplianceService.queueRecalculation(auth.organizationId);

  return apiSuccess(published);
});
