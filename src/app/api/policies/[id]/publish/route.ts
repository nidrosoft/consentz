import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { PolicyService } from '@/lib/services/policy-service';
import { ComplianceService } from '@/lib/services/compliance-service';
import { AuditService } from '@/lib/services/audit-service';
import { EvidenceStatusService } from '@/lib/services/evidence-status-service';

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = await PolicyService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Policy');
  }

  if (existing.status !== 'ACTIVE') {
    return ApiErrors.badRequest(
      `Cannot publish a policy with status "${existing.status}". Only ACTIVE (approved) policies can be published.`,
    );
  }

  const published = await PolicyService.publish(params.id, auth.dbUserId);
  if (!published) {
    return ApiErrors.notFound('Policy');
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_PUBLISHED',
    entityType: 'POLICY',
    entityId: params.id,
    description: `Published policy: ${existing.title}`,
  });

  // Mark POLICY-type evidence items as complete for linked domains
  const domains = published.domains ?? existing.domains ?? [];
  if (domains.length > 0) {
    EvidenceStatusService.markPolicyItemsComplete(auth.organizationId, params.id, domains).catch(() => {});
  }

  ComplianceService.queueRecalculation(auth.organizationId);

  return apiSuccess(published);
});
