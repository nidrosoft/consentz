import { baseLayout } from './base-layout';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface MonthlyReportData {
  userName: string;
  organizationName: string;
  month: string;
  year: number;
  currentScore: number;
  scoreChangeMonth: number;
  predictedRating: string;
  domainScores: { safe: number; effective: number; caring: number; responsive: number; well_led: number };
  gapsOpenedMonth: number;
  gapsClosedMonth: number;
  tasksCompletedMonth: number;
  evidenceUploadedMonth: number;
  policiesReviewedMonth: number;
  boardSummary: string;
}

export function monthlyReportEmail(data: MonthlyReportData): string {
  const changeColor = data.scoreChangeMonth > 0 ? '#16a34a' : data.scoreChangeMonth < 0 ? '#dc2626' : '#71717a';
  const changeIcon = data.scoreChangeMonth > 0 ? '📈' : data.scoreChangeMonth < 0 ? '📉' : '➡️';

  return baseLayout({
    preheader: `${data.month} ${data.year} CQC Report — Score: ${data.currentScore}% (${data.scoreChangeMonth >= 0 ? '+' : ''}${data.scoreChangeMonth})`,
    body: `
      <h1>Monthly CQC Compliance Report</h1>
      <p class="muted" style="margin-top: -12px;">${data.organizationName} · ${data.month} ${data.year}</p>

      <div class="card" style="background-color: #f0fdf4; border: 1px solid #bbf7d0;">
        <p style="font-size: 13px; font-weight: 600; color: #166534; margin: 0 0 8px;">Board Summary</p>
        <p style="font-size: 14px; color: #3f3f46; margin: 0; line-height: 22px;">${data.boardSummary}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td style="text-align: center; background: #f4f4f5; border-radius: 8px; padding: 20px; width: 33%;">
            <p style="font-size: 28px; font-weight: 700; margin: 0; color: #18181b;">${data.currentScore}%</p>
            <p style="font-size: 12px; color: #71717a; margin: 4px 0 0;">Compliance Score</p>
            <p style="font-size: 13px; font-weight: 600; margin: 6px 0 0; color: ${changeColor};">${changeIcon} ${data.scoreChangeMonth >= 0 ? '+' : ''}${data.scoreChangeMonth} this month</p>
          </td>
          <td width="12"></td>
          <td style="text-align: center; background: #f4f4f5; border-radius: 8px; padding: 20px; width: 33%;">
            <p style="font-size: 28px; font-weight: 700; margin: 0; color: #18181b;">${data.gapsClosedMonth}</p>
            <p style="font-size: 12px; color: #71717a; margin: 4px 0 0;">Gaps Closed</p>
            <p style="font-size: 13px; color: #71717a; margin: 6px 0 0;">${data.gapsOpenedMonth} opened</p>
          </td>
          <td width="12"></td>
          <td style="text-align: center; background: #f4f4f5; border-radius: 8px; padding: 20px; width: 33%;">
            <p style="font-size: 28px; font-weight: 700; margin: 0; color: #18181b;">${data.tasksCompletedMonth}</p>
            <p style="font-size: 12px; color: #71717a; margin: 4px 0 0;">Tasks Done</p>
            <p style="font-size: 13px; color: #71717a; margin: 6px 0 0;">${data.evidenceUploadedMonth} evidence uploads</p>
          </td>
        </tr>
      </table>

      <h2>Domain Scores</h2>
      <div class="card">
        <div class="card-row"><span class="card-label">🛡️ Safe</span><span class="card-value">${data.domainScores.safe}%</span></div>
        <div class="card-row"><span class="card-label">✅ Effective</span><span class="card-value">${data.domainScores.effective}%</span></div>
        <div class="card-row"><span class="card-label">💛 Caring</span><span class="card-value">${data.domainScores.caring}%</span></div>
        <div class="card-row"><span class="card-label">📬 Responsive</span><span class="card-value">${data.domainScores.responsive}%</span></div>
        <div class="card-row"><span class="card-label">👑 Well-Led</span><span class="card-value">${data.domainScores.well_led}%</span></div>
      </div>

      ${data.policiesReviewedMonth > 0 ? `<p class="muted">${data.policiesReviewedMonth} policies reviewed this month.</p>` : ''}

      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">View Full Dashboard →</a></p>
      <p class="muted" style="text-align: center;">This report is sent on the 1st of every month. Manage preferences in <a href="${APP_URL}/settings" style="color: #0d9488;">Settings</a>.</p>
    `,
  });
}
