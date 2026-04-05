import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { parsePagination } from '@/lib/pagination';
import { StaffService } from '@/lib/services/staff-service';
import { AuditService } from '@/lib/services/audit-service';
import { createStaffSchema, staffFilterSchema } from '@/lib/validations/staff';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);

  const rawFilters = staffFilterSchema.parse({
    staffRole: searchParams.get('staffRole') ?? undefined,
    isActive: searchParams.get('isActive') ?? undefined,
    department: searchParams.get('department') ?? undefined,
    registrationExpiring: searchParams.get('registrationExpiring') ?? undefined,
  });

  const filters: {
    isActive?: boolean;
    department?: string | string[];
    staffRole?: string | string[];
  } = {};

  if (rawFilters.isActive !== undefined) filters.isActive = rawFilters.isActive;
  if (rawFilters.department) filters.department = rawFilters.department;
  if (rawFilters.staffRole) filters.staffRole = rawFilters.staffRole;

  const result = await StaffService.list({
    organizationId: auth.organizationId,
    pagination: {
      page: pagination.page,
      limit: pagination.pageSize,
      search: pagination.search,
    },
    filters,
  });

  return apiSuccess(result.data, result.meta);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const body = await req.json();
  const validated = createStaffSchema.parse(body);

  const member = await StaffService.create({
    organizationId: auth.organizationId,
    firstName: validated.firstName,
    lastName: validated.lastName,
    email: validated.email,
    phone: validated.phone,
    jobTitle: validated.jobTitle,
    staffRole: validated.staffRole,
    department: validated.department,
    startDate: validated.startDate,
    registrationBody: validated.registrationBody,
    registrationNumber: validated.registrationNumber,
    registrationExpiry: validated.registrationExpiry,
    dbsNumber: validated.dbsNumber,
    dbsCertificateDate: validated.dbsCertificateDate,
    dbsLevel: validated.dbsLevel,
  });

  if (!member) {
    return ApiErrors.internal('Failed to create staff member. Please try again.');
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'STAFF_CREATED',
    entityType: 'STAFF',
    entityId: member.id,
    description: `Added staff member: ${validated.firstName} ${validated.lastName}`,
  });

  return apiSuccess(member, undefined, 201);
});
