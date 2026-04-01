import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface WeeklyDigestData {
  userName: string;
  organizationName: string;
  currentScore: number;
  scoreChange: number;
  predictedRating: string;
  gapsOpened: number;
  gapsClosed: number;
  tasksCompleted: number;
  tasksOverdue: number;
  upcomingDeadlines: { title: string; dueDate: string; type: string }[];
  topPriorityGap: { title: string; domain: string; severity: string } | null;
}

export function weeklyDigestEmail(data: WeeklyDigestData): string {
  const changeIcon = data.scoreChange > 0 ? '📈' : data.scoreChange < 0 ? '📉' : '➡️';
  const changeColor = data.scoreChange > 0 ? '#16a34a' : data.scoreChange < 0 ? '#dc2626' : '#71717a';

  const deadlinesList = data.upcomingDeadlines.slice(0, 5).map(d => `
    <div class="list-item"><strong>${d.title}</strong><br><span class="muted">${d.type} · Due: ${d.dueDate}</span></div>
  `).join('');

  return baseLayout({
    preheader: `Score: ${data.currentScore}% (${data.scoreChange >= 0 ? '+' : ''}${data.scoreChange}) · ${data.gapsClosed} gaps closed · ${data.tasksCompleted} tasks done`,
    body: `
      <h1>Weekly Compliance Summary</h1>
      <p class="muted" style="margin-top: -12px;">${data.organizationName} · Week ending ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td style="text-align: center; background: #f4f4f5; border-radius: 8px; padding: 20px; width: 33%;">
            <p style="font-size: 28px; font-weight: 700; margin: 0; color: #18181b;">${data.currentScore}%</p>
            <p style="font-size: 12px; color: #71717a; margin: 4px 0 0;">Compliance Score</p>
            <p style="font-size: 13px; font-weight: 600; margin: 6px 0 0; color: ${changeColor};">${changeIcon} ${data.scoreChange >= 0 ? '+' : ''}${data.scoreChange} this week</p>
          </td>
          <td width="12"></td>
          <td style="text-align: center; background: #f4f4f5; border-radius: 8px; padding: 20px; width: 33%;">
            <p style="font-size: 28px; font-weight: 700; margin: 0; color: #18181b;">${data.gapsClosed}</p>
            <p style="font-size: 12px; color: #71717a; margin: 4px 0 0;">Gaps Closed</p>
            <p style="font-size: 13px; color: #71717a; margin: 6px 0 0;">${data.gapsOpened} opened</p>
          </td>
          <td width="12"></td>
          <td style="text-align: center; background: #f4f4f5; border-radius: 8px; padding: 20px; width: 33%;">
            <p style="font-size: 28px; font-weight: 700; margin: 0; color: #18181b;">${data.tasksCompleted}</p>
            <p style="font-size: 12px; color: #71717a; margin: 4px 0 0;">Tasks Done</p>
            ${data.tasksOverdue > 0 ? `<p style="font-size: 13px; color: #dc2626; margin: 6px 0 0;">${data.tasksOverdue} overdue</p>` : '<p style="font-size: 13px; color: #16a34a; margin: 6px 0 0;">None overdue ✓</p>'}
          </td>
        </tr>
      </table>

      ${data.topPriorityGap ? `
        <h2>Top Priority This Week</h2>
        <div class="card">
          <div class="list-item">
            <span class="severity-dot ${data.topPriorityGap.severity === 'CRITICAL' ? 'dot-critical' : 'dot-high'}"></span>
            <strong>${data.topPriorityGap.title}</strong><br>
            <span class="muted">${data.topPriorityGap.domain} domain · ${data.topPriorityGap.severity}</span>
          </div>
        </div>
      ` : ''}

      ${data.upcomingDeadlines.length > 0 ? `<h2>Upcoming Deadlines</h2><div class="card">${deadlinesList}</div>` : ''}

      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">Open Dashboard →</a></p>
      <p class="muted" style="text-align: center;">You receive this digest every Monday. Manage email preferences in <a href="${APP_URL}/settings" style="color: #0d9488;">Settings</a>.</p>
    `,
  });
}
