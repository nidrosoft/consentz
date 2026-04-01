import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

export function syncFailedEmail(data: { userName: string; errorMessage: string; lastSuccessfulSync: string }): string {
  return baseLayout({
    preheader: 'The automatic Consentz data sync failed. Your compliance data may be stale.',
    body: `
      <h1>⚠️ Consentz Sync Failed</h1>
      <p>${data.userName}, the scheduled data sync with your Consentz account failed.</p>
      <div class="card">
        <div class="card-row"><span class="card-label">Error</span><span class="card-value">${data.errorMessage}</span></div>
        <div class="card-row"><span class="card-label">Last successful sync</span><span class="card-value">${data.lastSuccessfulSync}</span></div>
      </div>
      <p><strong>Common causes:</strong></p>
      <p>• Consentz credentials may have changed or expired<br>• The Consentz staging server may be temporarily down<br>• Your Consentz Clinic ID may have changed</p>
      <p>The system will retry automatically at the next scheduled sync.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/settings/integrations" class="btn">Check Integration Settings →</a></p>
    `,
  });
}
