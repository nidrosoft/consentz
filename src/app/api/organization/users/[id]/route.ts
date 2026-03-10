import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateUserRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'COMPLIANCE_MANAGER', 'DEPARTMENT_LEAD', 'STAFF_MEMBER', 'AUDITOR']),
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  const member = await db.organizationMember.findFirst({
    where: { id: memberId, organizationId: auth.organizationId },
  });
  if (!member) {
    return ApiErrors.notFound('User');
  }

  const body = await req.json();
  const validated = updateUserRoleSchema.parse(body);

  const updated = await db.organizationMember.update({
    where: { id: memberId },
    data: { role: validated.role },
  });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_ROLE_UPDATED',
    entityType: 'ORGANIZATION',
    entityId: memberId,
    description: `Updated user ${member.fullName} role to ${validated.role}`,
  });

  return apiSuccess({
    id: updated.id,
    name: updated.fullName,
    email: updated.email,
    role: updated.role,
    avatar: null,
  });
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  if (memberId === auth.dbUserId) {
    return ApiErrors.badRequest('Cannot remove your own account');
  }

  const member = await db.organizationMember.findFirst({
    where: { id: memberId, organizationId: auth.organizationId },
  });
  if (!member) {
    return ApiErrors.notFound('User');
  }

  await db.organizationMember.delete({ where: { id: memberId } });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_REMOVED',
    entityType: 'ORGANIZATION',
    entityId: memberId,
    description: `Removed user: ${member.fullName} (${member.email})`,
  });

  return apiSuccess({ deleted: true });
});
