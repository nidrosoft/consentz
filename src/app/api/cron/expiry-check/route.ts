import { withPublic } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { NotificationService } from '@/lib/services/notification-service';
import { db } from '@/lib/db';

export const GET = withPublic(async (req, { params }) => {
  const rateCheck = checkRateLimit('cron', 'cron');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const notifications: string[] = [];

  const orgs = await db.organization.findMany({ select: { id: true } });

  for (const org of orgs) {
    const orgId = org.id;

    const expiringEvidence = await db.evidenceItem.findMany({
      where: {
        organizationId: orgId,
        status: { not: 'ARCHIVED' },
        expiryDate: { gte: now, lte: thirtyDays },
      },
    });

    for (const ev of expiringEvidence) {
      await NotificationService.create({
        organizationId: orgId,
        type: 'WARNING',
        title: 'Evidence expiring soon',
        message: `${ev.title} expires on ${ev.expiryDate?.toISOString().split('T')[0]}`,
        entityType: 'EVIDENCE',
        entityId: ev.id,
        actionUrl: `/evidence/${ev.id}`,
      });
      notifications.push(`Evidence: ${ev.title}`);
    }

    const expiringStaff = await db.staffMember.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        dbsCertificateDate: { gte: now, lte: thirtyDays },
      },
    });

    for (const staff of expiringStaff) {
      const name = `${staff.firstName} ${staff.lastName}`;
      await NotificationService.create({
        organizationId: orgId,
        type: 'WARNING',
        title: 'DBS check expiring',
        message: `${name} DBS check may need renewal (certificate date: ${staff.dbsCertificateDate?.toISOString().split('T')[0]})`,
        entityType: 'STAFF',
        entityId: staff.id,
        actionUrl: `/staff/${staff.id}`,
      });
      notifications.push(`DBS: ${name}`);
    }

    const expiringTraining = await db.trainingRecord.findMany({
      where: {
        staffMember: { organizationId: orgId },
        expiryDate: { gte: now, lte: thirtyDays },
      },
      include: { staffMember: { select: { firstName: true, lastName: true } } },
    });

    for (const tr of expiringTraining) {
      const staffName = `${tr.staffMember.firstName} ${tr.staffMember.lastName}`;
      await NotificationService.create({
        organizationId: orgId,
        type: 'WARNING',
        title: 'Training certificate expiring',
        message: `${tr.courseName} for ${staffName} expires on ${tr.expiryDate?.toISOString().split('T')[0]}`,
        entityType: 'TRAINING',
        entityId: tr.id,
      });
      notifications.push(`Training: ${tr.courseName}`);
    }

    const reviewDuePolicies = await db.policy.findMany({
      where: {
        organizationId: orgId,
        status: { not: 'ARCHIVED' },
        nextReviewDate: { gte: now, lte: thirtyDays },
      },
    });

    for (const pol of reviewDuePolicies) {
      await NotificationService.create({
        organizationId: orgId,
        type: 'DOCUMENT_EXPIRING',
        title: 'Policy review due',
        message: `${pol.title} review due on ${pol.nextReviewDate?.toISOString().split('T')[0]}`,
        entityType: 'POLICY',
        entityId: pol.id,
        actionUrl: `/policies/${pol.id}`,
      });
      notifications.push(`Policy review: ${pol.title}`);
    }
  }

  return apiSuccess({
    checked: true,
    notificationsCreated: notifications.length,
    items: notifications,
  });
});
