import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface AssessmentCompletedData {
  userName: string;
  overallScore: number;
  predictedRating: string;
  domainScores: { safe: number; effective: number; caring: number; responsive: number; well_led: number };
  topGaps: { title: string; domain: string; severity: string }[];
  totalGaps: number;
}

function ratingBadgeClass(rating: string): string {
  if (rating === 'OUTSTANDING' || rating === 'GOOD') return 'badge-good';
  if (rating === 'REQUIRES_IMPROVEMENT') return 'badge-warning';
  return 'badge-critical';
}

function severityDotClass(severity: string): string {
  if (severity === 'CRITICAL') return 'dot-critical';
  if (severity === 'HIGH') return 'dot-high';
  return 'dot-medium';
}

export function assessmentCompletedEmail(data: AssessmentCompletedData): string {
  const gapsList = data.topGaps.map(g => `
    <div class="list-item"><span class="severity-dot ${severityDotClass(g.severity)}"></span><strong>${g.title}</strong><br><span class="muted">${g.domain} · ${g.severity}</span></div>
  `).join('');

  return baseLayout({
    preheader: `Your baseline score is ${data.overallScore}% — predicted rating: ${data.predictedRating}.`,
    body: `
      <h1>Your CQC Assessment is Complete</h1>
      <p>Great work, ${data.userName}. Your initial CQC compliance assessment has been processed. Here's your baseline:</p>
      <div style="text-align: center; margin: 24px 0;">
        <div class="metric-box" style="display: inline-block; padding: 24px 40px;">
          <p class="metric-value">${data.overallScore}%</p>
          <p class="metric-label">Overall Compliance Score</p>
          <p style="margin: 8px 0 0;"><span class="badge ${ratingBadgeClass(data.predictedRating)}">${data.predictedRating.replace('_', ' ')}</span></p>
        </div>
      </div>
      <h2>Domain Breakdown</h2>
      <div class="card">
        <div class="card-row"><span class="card-label">🛡️ Safe</span><span class="card-value">${data.domainScores.safe}%</span></div>
        <div class="card-row"><span class="card-label">✅ Effective</span><span class="card-value">${data.domainScores.effective}%</span></div>
        <div class="card-row"><span class="card-label">💛 Caring</span><span class="card-value">${data.domainScores.caring}%</span></div>
        <div class="card-row"><span class="card-label">📬 Responsive</span><span class="card-value">${data.domainScores.responsive}%</span></div>
        <div class="card-row"><span class="card-label">👑 Well-Led</span><span class="card-value">${data.domainScores.well_led}%</span></div>
      </div>
      <h2>Your Top ${data.topGaps.length} Priority Gaps</h2>
      <div class="card">${gapsList}</div>
      <p class="muted">${data.totalGaps} total gaps identified. Address critical ones first for the biggest score impact.</p>
      <hr class="divider">
      <p><strong>What's next?</strong> Your dashboard is now active. Link your Consentz account to enable ongoing compliance monitoring.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">View Your Dashboard →</a></p>
    `,
  });
}
