import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { StaffService } from '@/lib/services/staff-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateStaffSchema } from '@/lib/validations/staff';

export const GET = withAuth(async (req, { params, auth }) => {
  const member = StaffService.getById(params.id);

  if (!member) {
    return ApiErrors.notFound('Staff member');
  }

  // Includes training records
  return apiSuccess(member);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const existing = StaffService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Staff member');
  }

  const body = await req.json();
  const validated = updateStaffSchema.parse(body);

  const name = validated.firstName && validated.lastName
    ? `${validated.firstName} ${validated.lastName}`
    : undefined;

  const updated = StaffService.update({
    id: params.id,
    name,
    email: validated.email,
    role: validated.jobTitle,
    department: validated.department,
    isActive: validated.isActive,
  });

  if (!updated) {
    return ApiErrors.notFound('Staff member');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'STAFF_UPDATED',
    entityType: 'STAFF',
    entityId: params.id,
    description: `Updated staff record: ${existing.name}`,
  });

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = StaffService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Staff member');
  }

  const deactivated = StaffService.softDelete(params.id);
  if (!deactivated) {
    return ApiErrors.notFound('Staff member');
  }

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'STAFF_DEACTIVATED',
    entityType: 'STAFF',
    entityId: params.id,
    description: `Deactivated staff member: ${existing.name}`,
  });

  return apiSuccess({ deleted: true });
});
