import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { getDb } from '@/lib/db';
import { z } from 'zod';

export const GET = withAuth(async (req, { params, auth }) => {
  const client = await getDb();
  const { data: user } = await client.from('users')
    .select('email_notifications')
    .eq('id', auth.dbUserId)
    .single();

  return apiSuccess({
    id: auth.dbUserId,
    userId: auth.userId,
    fullName: auth.fullName,
    email: auth.email,
    role: auth.role,
    emailNotifications: user?.email_notifications ?? true,
  });
});

const updatePrefsSchema = z.object({
  emailNotifications: z.boolean().optional(),
}).strict();

export const PATCH = withAuth(async (req, { params, auth }) => {
  const body = await req.json();
  const validated = updatePrefsSchema.parse(body);
  const client = await getDb();

  const updates: Record<string, unknown> = {};
  if (validated.emailNotifications !== undefined) {
    updates.email_notifications = validated.emailNotifications;
  }

  if (Object.keys(updates).length > 0) {
    await client.from('users').update(updates).eq('id', auth.dbUserId);
  }

  return apiSuccess({ updated: true });
});
