import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';
import { inviteUserSchema } from '@/lib/validations/organization';
import { db } from '@/lib/db';

export const GET = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const members = await db.organizationMember.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  const users = members.map((m) => ({
    id: m.id,
    name: m.fullName,
    email: m.email,
    role: m.role,
    avatar: null,
  }));

  return apiSuccess(users);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const body = await req.json();
  const validated = inviteUserSchema.parse(body);

  const fullName = [validated.firstName, validated.lastName].filter(Boolean).join(' ') || validated.email;

  const member = await db.organizationMember.create({
    data: {
      organizationId: auth.organizationId,
      clerkUserId: `pending_${Date.now()}`,
      fullName,
      email: validated.email,
      role: validated.role as 'SUPER_ADMIN' | 'COMPLIANCE_MANAGER' | 'DEPARTMENT_LEAD' | 'STAFF_MEMBER' | 'AUDITOR',
    },
  });

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_INVITED',
    entityType: 'ORGANIZATION',
    entityId: member.id,
    description: `Invited user: ${validated.email} with role ${validated.role}`,
  });

  return apiSuccess({ id: member.id, name: fullName, email: validated.email, role: validated.role, avatar: null }, undefined, 201);
});
