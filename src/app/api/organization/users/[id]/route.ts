import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { requireMinRole } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';

const updateUserRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'COMPLIANCE_MANAGER', 'DEPARTMENT_LEAD', 'STAFF_MEMBER', 'AUDITOR']),
});

export const PATCH = withAuth(async (req, { params, auth }) => {
  const client = await getDb();
  requireMinRole(auth, 'ADMIN');

  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  const { data: member } = await client.from('organization_members')
    .select('*')
    .eq('id', memberId)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();

  if (!member) {
    return ApiErrors.notFound('User');
  }

  const body = await req.json();
  const validated = updateUserRoleSchema.parse(body);

  const { data: updated } = await client.from('organization_members')
    .update({ role: validated.role })
    .eq('id', memberId)
    .select()
    .single();

  // Also update the `users` table so resolveSessionAuth picks up the new role
  // regardless of which table it resolves from.
  if (!member.auth_user_id.startsWith('pending_invite_')) {
    await client.from('users')
      .update({ role: validated.role })
      .eq('supabase_user_id', member.auth_user_id);
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_ROLE_UPDATED',
    entityType: 'ORGANIZATION',
    entityId: memberId,
    description: `Updated user ${member.full_name} role to ${validated.role}`,
  });

  return apiSuccess({
    id: updated!.id,
    name: updated!.full_name,
    email: updated!.email,
    role: updated!.role,
    avatar: null,
  });
});

export const DELETE = withAuth(async (req, { params, auth }) => {
  const client = await getDb();
  requireMinRole(auth, 'ADMIN');

  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  if (memberId === auth.dbUserId) {
    return ApiErrors.badRequest('Cannot remove your own account');
  }

  const { data: member } = await client.from('organization_members')
    .select('*')
    .eq('id', memberId)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();

  if (!member) {
    return ApiErrors.notFound('User');
  }

  // 1. Delete the org membership row
  await client.from('organization_members').delete().eq('id', memberId);

  // 2. For real (non-pending) users, unlink from the org in the `users` table
  //    and invalidate their Supabase session so they're locked out immediately.
  if (!member.auth_user_id.startsWith('pending_invite_')) {
    await client.from('users')
      .update({ organization_id: null })
      .eq('supabase_user_id', member.auth_user_id);

    try {
      const admin = createAdminSupabaseClient();
      await admin.auth.admin.signOut(member.auth_user_id);
    } catch (e) {
      console.warn('[user-removal] Could not sign out user session:', e);
    }
  }

  await AuditService.log({
    organizationId: auth.organizationId,
    userId: auth.dbUserId,
    action: 'USER_REMOVED',
    entityType: 'ORGANIZATION',
    entityId: memberId,
    description: `Removed user: ${member.full_name} (${member.email})`,
  });

  return apiSuccess({ deleted: true });
});
