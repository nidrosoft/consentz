import { withPublic } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { db } from '@/lib/db';

export const GET = withPublic(async (req, { params }) => {
  const rateCheck = checkRateLimit('cron', 'cron');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const digests: { organizationId: string; unreadCount: number }[] = [];

  const orgs = await db.organization.findMany({ select: { id: true, name: true } });

  for (const org of orgs) {
    const unreadCount = await db.notification.count({
      where: {
        organizationId: org.id,
        isRead: false,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (unreadCount === 0) continue;

    const urgentCount = await db.notification.count({
      where: {
        organizationId: org.id,
        isRead: false,
        priority: { in: ['HIGH', 'URGENT'] },
        createdAt: { gte: oneDayAgo },
      },
    });

    digests.push({ organizationId: org.id, unreadCount });

    // TODO: send email digest via Resend once email service is configured
    // await EmailService.sendDigest({
    //   organizationId: org.id,
    //   organizationName: org.name,
    //   unreadCount,
    //   urgentCount,
    // });
  }

  return apiSuccess({
    processed: true,
    digestsSent: digests.length,
    digests,
  });
});
