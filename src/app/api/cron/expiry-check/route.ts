import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-response';
import { verifyCronSecret } from '@/lib/cron-auth';
import { NotificationService } from '@/lib/services/notification-service';
import { detectEvidenceGaps, generateEvidenceStatusGaps } from '@/lib/services/gap-generator';
import { EvidenceStatusService } from '@/lib/services/evidence-status-service';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req);
  if (authError) return authError;

  const client = await getDb();

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nowISO = now.toISOString();
  const thirtyDaysISO = thirtyDays.toISOString();
  const notifications: string[] = [];

  const { data: orgs } = await client.from('organizations').select('id');

  for (const org of orgs ?? []) {
    const orgId = org.id;

    const { data: expiringEvidence } = await client.from('evidence_items')
      .select('*')
      .eq('organization_id', orgId)
      .neq('status', 'ARCHIVED')
      .gte('expiry_date', nowISO)
      .lte('expiry_date', thirtyDaysISO);

    for (const ev of expiringEvidence ?? []) {
      await NotificationService.create({
        organizationId: orgId,
        type: 'WARNING',
        title: 'Evidence expiring soon',
        message: `${ev.title} expires on ${ev.expiry_date?.split('T')[0]}`,
        entityType: 'EVIDENCE',
        entityId: ev.id,
        actionUrl: `/evidence/${ev.id}`,
      });
      notifications.push(`Evidence: ${ev.title}`);
    }

    const { data: expiringStaff } = await client.from('staff_members')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .gte('dbs_certificate_date', nowISO)
      .lte('dbs_certificate_date', thirtyDaysISO);

    for (const staff of expiringStaff ?? []) {
      const name = `${staff.first_name} ${staff.last_name}`;
      await NotificationService.create({
        organizationId: orgId,
        type: 'WARNING',
        title: 'DBS check expiring',
        message: `${name} DBS check may need renewal (certificate date: ${staff.dbs_certificate_date?.split('T')[0]})`,
        entityType: 'STAFF',
        entityId: staff.id,
        actionUrl: `/staff/${staff.id}`,
      });
      notifications.push(`DBS: ${name}`);
    }

    const { data: expiringTraining } = await client.from('training_records')
      .select('*, staff_member:staff_members!inner(first_name, last_name, organization_id)')
      .eq('staff_members.organization_id', orgId)
      .gte('expiry_date', nowISO)
      .lte('expiry_date', thirtyDaysISO);

    for (const tr of expiringTraining ?? []) {
      const staffName = `${(tr.staff_member as any).first_name} ${(tr.staff_member as any).last_name}`;
      await NotificationService.create({
        organizationId: orgId,
        type: 'WARNING',
        title: 'Training certificate expiring',
        message: `${tr.course_name} for ${staffName} expires on ${tr.expiry_date?.split('T')[0]}`,
        entityType: 'TRAINING',
        entityId: tr.id,
      });
      notifications.push(`Training: ${tr.course_name}`);
    }

    const { data: reviewDuePolicies } = await client.from('policies')
      .select('*')
      .eq('organization_id', orgId)
      .neq('status', 'ARCHIVED')
      .gte('next_review_date', nowISO)
      .lte('next_review_date', thirtyDaysISO);

    for (const pol of reviewDuePolicies ?? []) {
      await NotificationService.create({
        organizationId: orgId,
        type: 'DOCUMENT_EXPIRING',
        title: 'Policy review due',
        message: `${pol.title} review due on ${pol.next_review_date?.split('T')[0]}`,
        entityType: 'POLICY',
        entityId: pol.id,
        actionUrl: `/policies/${pol.id}`,
      });
      notifications.push(`Policy review: ${pol.title}`);
    }
  }

  let gapsCreated = 0;
  let evidenceStatusGapsCreated = 0;
  for (const org of orgs ?? []) {
    await EvidenceStatusService.refreshExpiryStatuses(org.id);

    gapsCreated += await detectEvidenceGaps(org.id);

    const { data: orgRow } = await client
      .from('organizations')
      .select('service_type')
      .eq('id', org.id)
      .maybeSingle();
    const serviceType = orgRow?.service_type ?? 'AESTHETIC_CLINIC';
    const result = await generateEvidenceStatusGaps({ organizationId: org.id, serviceType });
    evidenceStatusGapsCreated += result.created;
  }

  return apiSuccess({
    checked: true,
    notificationsCreated: notifications.length,
    gapsCreated,
    evidenceStatusGapsCreated,
  });
}
