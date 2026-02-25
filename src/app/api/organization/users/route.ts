import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';
import { inviteUserSchema } from '@/lib/validations/organization';
import { userStore, generateId } from '@/lib/mock-data/store';

export const GET = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const users = userStore.getAll();
  return apiSuccess(users);
});

export const POST = withAuth(async (req, { params, auth }) => {
  requireMinRole(auth, 'ADMIN');

  const body = await req.json();
  const validated = inviteUserSchema.parse(body);

  const newUser = userStore.create({
    id: generateId('user'),
    name: [validated.firstName, validated.lastName].filter(Boolean).join(' ') || validated.email,
    email: validated.email,
    role: validated.role,
    avatar: null,
  });

  AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_INVITED',
    entityType: 'ORGANIZATION',
    entityId: newUser.id,
    description: `Invited user: ${validated.email} with role ${validated.role}`,
  });

  return apiSuccess(newUser, undefined, 201);
});
