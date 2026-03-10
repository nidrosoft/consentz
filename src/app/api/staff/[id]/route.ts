import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { StaffService } from '@/lib/services/staff-service';
import { AuditService } from '@/lib/services/audit-service';
import { updateStaffSchema } from '@/lib/validations/staff';

export const GET = withAuth(async (req, { params, auth }) => {
  const member = await StaffService.getById(params.id);

  if (!member) {
    return ApiErrors.notFound('Staff member');
  }

  // Includes training records
  return apiSuccess(member);
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const existing = await StaffService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Staff member');
  }

  const body = await req.json();
  const validated = updateStaffSchema.parse(body);

  const updateData: Record<string, unknown> = {};
  if (validated.firstName !== undefined) updateData.firstName = validated.firstName;
  if (validated.lastName !== undefined) updateData.lastName = validated.lastName;
  if (validated.email !== undefined) updateData.email = validated.email;
  if (validated.phone !== undefined) updateData.phone = validated.phone;
  if (validated.jobTitle !== undefined) updateData.jobTitle = validated.jobTitle;
  if (validated.staffRole !== undefined) updateData.staffRole = validated.staffRole;
  if (validated.department !== undefined) updateData.department = validated.department;
  if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
  if (validated.startDate !== undefined) updateData.startDate = validated.startDate;
  if (validated.endDate !== undefined) updateData.endDate = validated.endDate;

  const updated = await StaffService.update(params.id, updateData);

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'STAFF_UPDATED',
    entityType: 'STAFF',
    entityId: params.id,
    description: `Updated staff record: ${existing.firstName} ${existing.lastName}`,
  });

  return apiSuccess(updated);
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const existing = await StaffService.getById(params.id);
  if (!existing) {
    return ApiErrors.notFound('Staff member');
  }

  await StaffService.softDelete(params.id);

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'STAFF_DEACTIVATED',
    entityType: 'STAFF',
    entityId: params.id,
    description: `Deactivated staff member: ${existing.firstName} ${existing.lastName}`,
  });

  return apiSuccess({ deleted: true });
});
