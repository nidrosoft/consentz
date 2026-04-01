import { sendEmail } from '../send';
import { incidentReportedEmail } from '../templates/incident-reported';
import { getDb } from '@/lib/db';

export async function handleIncidentCreated(params: {
  organizationId: string;
  reporterUserId: string;
  incidentId: string;
  incidentTitle: string;
  severity: string;
  incidentType: string;
}) {
  const db = await getDb();

  const { data: reporter } = await db
    .from('users')
    .select('name, email')
    .eq('id', params.reporterUserId)
    .single();

  if (!reporter) return;

  const reportedAt = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // Confirmation to reporter
  await sendEmail(
    {
      to: reporter.email,
      subject: `Incident Reported: ${params.incidentTitle}`,
      html: incidentReportedEmail({
        recipientName: reporter.name || 'there',
        incidentTitle: params.incidentTitle,
        severity: params.severity,
        incidentType: params.incidentType,
        reportedBy: reporter.name || 'Unknown',
        reportedAt,
        incidentId: params.incidentId,
        isReporter: true,
      }),
    },
    { organizationId: params.organizationId, userId: params.reporterUserId, emailType: 'incident_reported_confirmation' },
  );

  // Notification to admins (excluding reporter if they're admin)
  const { data: admins } = await db
    .from('users')
    .select('id, name, email')
    .eq('organization_id', params.organizationId)
    .in('role', ['OWNER', 'ADMIN'])
    .neq('id', params.reporterUserId);

  for (const admin of admins ?? []) {
    await sendEmail(
      {
        to: admin.email,
        subject: `Incident Reported: ${params.incidentTitle}`,
        html: incidentReportedEmail({
          recipientName: admin.name || 'there',
          incidentTitle: params.incidentTitle,
          severity: params.severity,
          incidentType: params.incidentType,
          reportedBy: reporter.name || 'Unknown',
          reportedAt,
          incidentId: params.incidentId,
          isReporter: false,
        }),
      },
      { organizationId: params.organizationId, userId: admin.id, emailType: 'incident_reported_admin' },
    );
  }
}
