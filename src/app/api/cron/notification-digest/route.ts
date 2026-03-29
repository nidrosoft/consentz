import { withPublic } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { sendNotificationDigest } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getDb } from '@/lib/db';

export const GET = withPublic(async (req, { params }) => {
  const client = await getDb();
  const rateCheck = checkRateLimit('cron', 'cron');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const digests: { organizationId: string; unreadCount: number; emailsSent: number }[] = [];
  let totalEmailsSent = 0;

  const { data: orgs } = await client.from('organizations').select('id, name');

  for (const org of orgs ?? []) {
    const { data: notifications } = await client.from('notifications')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_read', false)
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (!notifications || notifications.length === 0) continue;

    const unreadCount = notifications.length;

    const { data: recipients } = await client.from('users')
      .select('email, first_name, last_name')
      .eq('organization_id', org.id)
      .eq('email_notifications', true)
      .is('deleted_at', null);

    let emailsSent = 0;
    const digestItems = notifications.map((n) => ({
      title: n.title,
      message: n.message,
      createdAt: n.created_at,
    }));

    for (const user of recipients ?? []) {
      const userName =
        [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email;
      const result = await sendNotificationDigest({
        to: user.email,
        userName,
        organizationName: org.name,
        notifications: digestItems,
      });
      if (result.success) {
        emailsSent += 1;
        totalEmailsSent += 1;
      }
    }

    digests.push({ organizationId: org.id, unreadCount, emailsSent });
  }

  return apiSuccess({
    processed: true,
    digestsSent: digests.length,
    emailsSent: totalEmailsSent,
    digests,
  });
});
