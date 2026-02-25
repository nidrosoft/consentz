import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';
import { userStore } from '@/lib/mock-data/store';
import { z } from 'zod';

const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = userStore.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('User');
  }

  const body = await req.json();
  const validated = updateUserRoleSchema.parse(body);

  const updated = userStore.update(params.id, { role: validated.role });
  if (!updated) {
    return ApiErrors.notFound('User');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_ROLE_UPDATED',
    entityType: 'ORGANIZATION',
    entityId: params.id,
    description: `Updated user ${existing.name} role to ${validated.role}`,
  });

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = userStore.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('User');
  }

  // Prevent self-deletion
  if (params.id === auth.dbUserId) {
    return ApiErrors.badRequest('Cannot remove your own account');
  }

  const removed = userStore.remove(params.id);
  if (!removed) {
    return ApiErrors.notFound('User');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_REMOVED',
    entityType: 'ORGANIZATION',
    entityId: params.id,
    description: `Removed user: ${existing.name} (${existing.email})`,
  });

  return apiSuccess({ deleted: true });
});
