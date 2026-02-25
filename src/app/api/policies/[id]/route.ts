import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { PolicyService } from '@/lib/services/policy-service';
import { AuditService } from '@/lib/services/audit-service';
import { updatePolicySchema } from '@/lib/validations/policy';

export const GET = withAuth(async (req, { params, auth }) => {
  const policy = PolicyService.getById(params.id);

  if (!policy) {
    return ApiErrors.notFound('Policy');
  }

  return apiSuccess(policy);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const existing = PolicyService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Policy');
  }

  // Only DRAFT and REVIEW policies can be edited
  if (existing.status !== 'DRAFT' && existing.status !== 'REVIEW') {
    return ApiErrors.badRequest(
      `Cannot edit a policy with status "${existing.status}". Only DRAFT and REVIEW policies can be edited.`,
    );
  }

  const body = await req.json();
  const validated = updatePolicySchema.parse(body);

  const updated = PolicyService.update({
    id: params.id,
    title: validated.title,
    content: validated.content,
    category: validated.category,
    status: validated.status,
  });

  if (!updated) {
    return ApiErrors.notFound('Policy');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_UPDATED',
    entityType: 'POLICY',
    entityId: params.id,
    description: `Updated policy: ${existing.title}`,
  });

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = PolicyService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Policy');
  }

  // Cannot delete published policies
  if (existing.status === 'PUBLISHED') {
    return ApiErrors.badRequest(
      'Cannot delete a published policy. Archive it instead.',
    );
  }

  const deleted = PolicyService.softDelete(params.id);
  if (!deleted) {
    return ApiErrors.notFound('Policy');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'POLICY_DELETED',
    entityType: 'POLICY',
    entityId: params.id,
    description: `Deleted policy: ${existing.title}`,
  });

  return apiSuccess({ deleted: true });
});
