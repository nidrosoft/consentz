import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';
import { AuditService } from '@/lib/services/audit-service';
import { inviteUserSchema } from '@/lib/validations/organization';
import { getDb } from '@/lib/db';

const INVITE_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
  VIEWER: 'Viewer',
};

const INVITE_TO_MEMBER_ROLE = {
  ADMIN: 'COMPLIANCE_MANAGER',
  MANAGER: 'DEPARTMENT_LEAD',
  STAFF: 'STAFF_MEMBER',
  VIEWER: 'AUDITOR',
} as const;

export const GET = withAuth(async (req, { params, auth }) => {
  const client = await getDb();
  requireMinRole(auth, 'ADMIN');

  const { data: members } = await client.from('organization_members')
    .select('*')
    .eq('organization_id', auth.organizationId)
    .order('created_at', { ascending: false });

  const users = (members ?? []).map((m) => ({
    id: m.id,
    name: m.full_name,
    email: m.email,
    role: m.role,
    avatar: null,
    status: m.auth_user_id.startsWith('pending_invite_') ? ('Invited' as const) : ('Active' as const),
  }));

  return apiSuccess(users);
});

export const POST = withAuth(async (req, { params, auth }) => {
  const client = await getDb();
  requireMinRole(auth, 'ADMIN');

  const body = await req.json();
  const validated = inviteUserSchema.parse(body);

  const fullName = [validated.firstName, validated.lastName].filter(Boolean).join(' ') || validated.email;

  const { data: member } = await client.from('organization_members')
    .insert({
      organization_id: auth.organizationId,
      auth_user_id: `pending_invite_${Date.now()}`,
      full_name: fullName,
      email: validated.email,
      role: INVITE_TO_MEMBER_ROLE[validated.role],
    })
    .select()
    .single();

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_INVITED',
    entityType: 'ORGANIZATION',
    entityId: member!.id,
    description: `Invited user: ${validated.email} with role ${validated.role}`,
  });

  const { data: organization } = await client.from('organizations')
    .select('name')
    .eq('id', auth.organizationId)
    .single();

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com').replace(/\/$/, '');
  const inviteUrl = `${baseUrl}/sign-up?email=${encodeURIComponent(validated.email)}`;

  await sendInvitationEmail({
    to: validated.email,
    inviterName: auth.fullName,
    organizationName: organization?.name ?? 'your organization',
    role: INVITE_ROLE_LABELS[validated.role] ?? validated.role,
    inviteUrl,
  });

  return apiSuccess({ id: member!.id, name: fullName, email: validated.email, role: validated.role, avatar: null }, undefined, 201);
});
