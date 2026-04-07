import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { monthlyReportEmail } from '@/lib/email/templates/monthly-report';
import { sendEmail } from '@/lib/email/send';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const { data: orgs } = await db.from('organizations').select('id, name');
  if (!orgs?.length) return NextResponse.json({ sent: 0 });

  const now = new Date();
  const monthName = now.toLocaleDateString('en-GB', { month: 'long' });
  const year = now.getFullYear();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();

  let sent = 0;

  for (const org of orgs) {
    const { data: admins } = await db
      .from('users')
      .select('id, name, email')
      .eq('organization_id', org.id)
      .in('role', ['OWNER', 'ADMIN']);

    if (!admins?.length) continue;

    const [scores, gapsOpened, gapsClosed, tasksDone, evidenceCount, policiesCount] = await Promise.all([
      db.from('compliance_scores').select('*').eq('organization_id', org.id).single(),
      db.from('compliance_gaps').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).gte('created_at', oneMonthAgo),
      db.from('compliance_gaps').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'RESOLVED').gte('updated_at', oneMonthAgo),
      db.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'DONE').gte('updated_at', oneMonthAgo),
      db.from('evidence').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).gte('created_at', oneMonthAgo),
      db.from('policies').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).gte('updated_at', oneMonthAgo),
    ]);

    const currentScore = scores.data?.score || 0;
    const scoreChange = currentScore - (scores.data?.previous_score || currentScore);
    const predictedRating = scores.data?.predicted_rating || 'INADEQUATE';

    const boardSummary = `${org.name} achieved a CQC compliance score of ${currentScore}% (${scoreChange >= 0 ? '+' : ''}${scoreChange} this month), with a predicted rating of "${predictedRating.replace('_', ' ')}". ${gapsClosed.count || 0} compliance gaps were closed and ${tasksDone.count || 0} tasks completed during the period.`;

    for (const admin of admins) {
      const html = monthlyReportEmail({
        userName: admin.name || 'there',
        organizationName: org.name,
        month: monthName,
        year,
        currentScore,
        scoreChangeMonth: scoreChange,
        predictedRating,
        domainScores: {
          safe: scores.data?.safe_score || 0,
          effective: scores.data?.effective_score || 0,
          caring: scores.data?.caring_score || 0,
          responsive: scores.data?.responsive_score || 0,
          well_led: scores.data?.well_led_score || 0,
        },
        gapsOpenedMonth: gapsOpened.count || 0,
        gapsClosedMonth: gapsClosed.count || 0,
        tasksCompletedMonth: tasksDone.count || 0,
        evidenceUploadedMonth: evidenceCount.count || 0,
        policiesReviewedMonth: policiesCount.count || 0,
        boardSummary,
      });

      await sendEmail(
        { to: admin.email, subject: `Monthly CQC Compliance Report — ${monthName} ${year}`, html },
        { organizationId: org.id, userId: admin.id, emailType: 'monthly_report' },
      );
      sent++;
    }
  }

  return NextResponse.json({ success: true, sent });
}
