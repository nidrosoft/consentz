import { withPublic } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limiter';
import { NotificationService } from '@/lib/services/notification-service';
import {
  evidenceStore,
  staffStore,
  trainingStore,
  policyStore,
} from '@/lib/mock-data/store';

export const GET = withPublic(async (req, { params }) => {
  const rateCheck = checkRateLimit('cron', 'cron');
  if (!rateCheck.allowed) {
    return ApiErrors.tooManyRequests();
  }

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const notifications: string[] = [];

  // Check expiring evidence
  const expiringEvidence = evidenceStore.filter((e) => {
    if (e.deletedAt || !e.expiresAt) return false;
    const expiry = new Date(e.expiresAt);
    return expiry <= thirtyDays && expiry >= now;
  });

  for (const ev of expiringEvidence) {
    NotificationService.create({
      organizationId: 'org-1',
      type: 'WARNING',
      title: 'Evidence expiring soon',
      message: `${ev.name} expires on ${ev.expiresAt}`,
      entityType: 'EVIDENCE',
      entityId: ev.id,
      actionUrl: `/evidence/${ev.id}`,
    });
    notifications.push(`Evidence: ${ev.name}`);
  }

  // Check DBS expiry for staff
  const expiringDbs = staffStore.filter((s) => {
    if (!s.isActive || !s.dbsExpiry) return false;
    const expiry = new Date(s.dbsExpiry);
    return expiry <= thirtyDays && expiry >= now;
  });

  for (const staff of expiringDbs) {
    NotificationService.create({
      organizationId: 'org-1',
      type: 'WARNING',
      title: 'DBS check expiring',
      message: `${staff.name} DBS check expires on ${staff.dbsExpiry}`,
      entityType: 'STAFF',
      entityId: staff.id,
      actionUrl: `/staff/${staff.id}`,
    });
    notifications.push(`DBS: ${staff.name}`);
  }

  // Check expiring training
  const expiringTraining = trainingStore.filter((t) => {
    if (!t.expiryDate) return false;
    const expiry = new Date(t.expiryDate);
    return expiry <= thirtyDays && expiry >= now;
  });

  for (const tr of expiringTraining) {
    NotificationService.create({
      organizationId: 'org-1',
      type: 'WARNING',
      title: 'Training certificate expiring',
      message: `${tr.courseName} for staff ${tr.staffId} expires on ${tr.expiryDate}`,
      entityType: 'TRAINING',
      entityId: tr.id,
    });
    notifications.push(`Training: ${tr.courseName}`);
  }

  // Check policy review dates
  const reviewDuePolicies = policyStore.filter((p) => {
    if (p.deletedAt || !p.nextReviewDate) return false;
    const reviewDate = new Date(p.nextReviewDate);
    return reviewDate <= thirtyDays && reviewDate >= now;
  });

  for (const pol of reviewDuePolicies) {
    NotificationService.create({
      organizationId: 'org-1',
      type: 'INFO',
      title: 'Policy review due',
      message: `${pol.title} review due on ${pol.nextReviewDate}`,
      entityType: 'POLICY',
      entityId: pol.id,
      actionUrl: `/policies/${pol.id}`,
    });
    notifications.push(`Policy review: ${pol.title}`);
  }

  return apiSuccess({
    checked: true,
    notificationsCreated: notifications.length,
    items: notifications,
  });
});
