import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { incidentInvestigationEmail } from '@/lib/email/templates/incident-investigation';
import { sendEmail } from '@/lib/email/send';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const { data: staleIncidents } = await db
    .from('incidents')
    .select('id, title, severity, organization_id, created_at')
    .eq('status', 'REPORTED')
    .lte('created_at', fiveDaysAgo);

  if (!staleIncidents?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const incident of staleIncidents) {
    const daysOpen = Math.floor((Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60 * 24));

    const { data: admins } = await db
      .from('users')
      .select('id, name, email')
      .eq('organization_id', incident.organization_id)
      .in('role', ['OWNER', 'ADMIN']);

    for (const admin of admins ?? []) {
      await sendEmail(
        {
          to: admin.email,
          subject: `Reminder: Incident "${incident.title}" awaiting investigation (${daysOpen} days)`,
          html: incidentInvestigationEmail({
            recipientName: admin.name || 'there',
            incidentTitle: incident.title,
            severity: incident.severity,
            daysOpen,
            incidentId: incident.id,
          }),
        },
        { organizationId: incident.organization_id, userId: admin.id, emailType: 'incident_investigation_reminder' },
      );
      sent++;
    }
  }

  return NextResponse.json({ success: true, sent });
}
