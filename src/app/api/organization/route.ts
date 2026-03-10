import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';
import { updateOrganizationSchema } from '@/lib/validations/organization';
import { db } from '@/lib/db';

export const GET = withAuth(async (req, { params, auth }) => {
  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
  });

  if (!org) {
    return ApiErrors.notFound('Organization');
  }

  const [userCount, staffCount, policyCount, evidenceCount] = await Promise.all([
    db.user.count({ where: { organizationId: auth.organizationId } }),
    db.staffMember.count({ where: { organizationId: auth.organizationId, isActive: true } }),
    db.policy.count({ where: { organizationId: auth.organizationId, status: { not: 'ARCHIVED' } } }),
    db.evidenceItem.count({ where: { organizationId: auth.organizationId, status: { not: 'ARCHIVED' } } }),
  ]);

  return apiSuccess({
    ...org,
    counts: { users: userCount, activeStaff: staffCount, policies: policyCount, evidence: evidenceCount },
  });
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = await db.organization.findUnique({
    where: { id: auth.organizationId },
  });
  if (!existing) {
    return ApiErrors.notFound('Organization');
  }

  const body = await req.json();
  const validated = updateOrganizationSchema.parse(body);

  const updated = await db.organization.update({
    where: { id: auth.organizationId },
    data: validated,
  });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'ORGANIZATION_UPDATED',
    entityType: 'ORGANIZATION',
    entityId: auth.organizationId,
    description: 'Updated organization settings',
  });

  return apiSuccess(updated);
});
