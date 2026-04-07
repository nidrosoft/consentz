import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { weeklyDigestEmail } from '@/lib/email/templates/weekly-digest';
import { sendEmail } from '@/lib/email/send';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const { data: orgs } = await db.from('organizations').select('id, name');

  if (!orgs?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const org of orgs) {
    const { data: admins } = await db
      .from('users')
      .select('id, name, email, role')
      .eq('organization_id', org.id)
      .in('role', ['OWNER', 'ADMIN']);

    if (!admins?.length) continue;

    const [scores, gapsOpened, gapsClosed, tasksDone, tasksOverdue, topGap, deadlines] = await Promise.all([
      db.from('compliance_scores').select('*').eq('organization_id', org.id).single(),
      db.from('compliance_gaps').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).gte('created_at', oneWeekAgo),
      db.from('compliance_gaps').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'RESOLVED').gte('updated_at', oneWeekAgo),
      db.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'DONE').gte('updated_at', oneWeekAgo),
      db.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).neq('status', 'DONE').lt('due_date', new Date().toISOString()),
      db.from('compliance_gaps').select('title, domain, severity').eq('organization_id', org.id).eq('status', 'OPEN').in('severity', ['CRITICAL', 'HIGH']).order('severity').limit(1).maybeSingle(),
      db.from('tasks').select('title, due_date, domain').eq('organization_id', org.id).neq('status', 'DONE').gte('due_date', new Date().toISOString()).order('due_date').limit(5),
    ]);

    const currentScore = scores.data?.score || 0;
    const scoreChange = currentScore - (scores.data?.previous_score || currentScore);

    for (const admin of admins) {
      const html = weeklyDigestEmail({
        userName: admin.name || 'there',
        organizationName: org.name,
        currentScore,
        scoreChange,
        predictedRating: scores.data?.predicted_rating || 'INADEQUATE',
        gapsOpened: gapsOpened.count || 0,
        gapsClosed: gapsClosed.count || 0,
        tasksCompleted: tasksDone.count || 0,
        tasksOverdue: tasksOverdue.count || 0,
        upcomingDeadlines: (deadlines.data || []).map((d: Record<string, string>) => ({
          title: d.title,
          dueDate: d.due_date ? new Date(d.due_date).toLocaleDateString('en-GB') : 'No date',
          type: d.domain || 'Task',
        })),
        topPriorityGap: topGap.data || null,
      });

      await sendEmail(
        { to: admin.email, subject: `Weekly CQC Compliance Summary — ${org.name}`, html },
        { organizationId: org.id, userId: admin.id, emailType: 'weekly_digest' },
      );
      sent++;
    }
  }

  return NextResponse.json({ success: true, sent });
}
