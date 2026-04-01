import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

export function syncCriticalIssuesEmail(data: { userName: string; issues: { title: string; domain: string }[]; syncTime: string }): string {
  const issueList = data.issues.map(i => `
    <div class="list-item"><span class="severity-dot dot-critical"></span><strong>${i.title}</strong><br><span class="muted">${i.domain} domain</span></div>
  `).join('');

  return baseLayout({
    preheader: `${data.issues.length} critical compliance issue(s) found in your latest Consentz sync.`,
    body: `
      <h1>🔴 Critical Issues Detected</h1>
      <p>${data.userName}, the latest Consentz data sync at ${data.syncTime} detected <strong>${data.issues.length} critical compliance issue(s)</strong> that require immediate attention:</p>
      <div class="card">${issueList}</div>
      <p>Critical issues can lead to CQC enforcement action if found during an inspection. Tasks have been auto-created on your dashboard for each item.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">Review Issues Now →</a></p>
    `,
  });
}
