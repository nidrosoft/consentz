import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';
import { updateOrganizationSchema } from '@/lib/validations/organization';
import {
  organizationStore,
  userStore,
  staffStore,
  policyStore,
  evidenceStore,
} from '@/lib/mock-data/store';

export const GET = withAuth(async (req, { params, auth }) => {
  const org = organizationStore.getById(auth.organizationId);

  if (!org) {
    return ApiErrors.notFound('Organization');
  }

  const counts = {
    users: userStore.count(),
    activeStaff: staffStore.count((s) => s.isActive),
    policies: policyStore.count((p) => !p.deletedAt),
    evidence: evidenceStore.count((e) => !e.deletedAt),
  };

  return apiSuccess({ ...org, counts });
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = organizationStore.getById(auth.organizationId);
  if (!existing) {
    return ApiErrors.notFound('Organization');
  }

  const body = await req.json();
  const validated = updateOrganizationSchema.parse(body);

  const updated = organizationStore.update(auth.organizationId, validated);
  if (!updated) {
    return ApiErrors.notFound('Organization');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'ORGANIZATION_UPDATED',
    entityType: 'ORGANIZATION',
    entityId: auth.organizationId,
    description: 'Updated organization settings',
  });

  return apiSuccess(updated);
});
