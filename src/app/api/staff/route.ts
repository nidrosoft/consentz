import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
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
    department?: string;
  } = {};

  if (rawFilters.isActive !== undefined) filters.isActive = rawFilters.isActive;
  if (rawFilters.department) filters.department = rawFilters.department;

  const result = StaffService.list({
    organizationId: auth.organizationId,
    pagination,
    filters,
  });

  return apiSuccess(result.data, result.meta);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'MANAGER');

  const body = await req.json();
  const validated = createStaffSchema.parse(body);

  const member = StaffService.create({
    organizationId: auth.organizationId,
    name: `${validated.firstName} ${validated.lastName}`,
    email: validated.email ?? '',
    role: validated.jobTitle,
    department: validated.department ?? '',
    startDate: validated.startDate,
  });

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'STAFF_CREATED',
    entityType: 'STAFF',
    entityId: member.id,
    description: `Added staff member: ${validated.firstName} ${validated.lastName}`,
  });

  return apiSuccess(member, undefined, 201);
});
