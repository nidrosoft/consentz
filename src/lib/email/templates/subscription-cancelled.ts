import { baseLayout } from './base-layout';

export function subscriptionCancelledEmail(data: { userName: string; accessUntil: string }): string {
  return baseLayout({
    preheader: 'Your subscription has been cancelled. Your access continues until the end of your billing period.',
    body: `
      <h1>Subscription Cancelled</h1>
      <p>${data.userName}, your CQC Compliance subscription has been cancelled.</p>
      <div class="card">
        <div class="card-row"><span class="card-label">Access until</span><span class="card-value">${data.accessUntil}</span></div>
        <div class="card-row"><span class="card-label">After that</span><span class="card-value">Read-only access to your data</span></div>
      </div>
      <p>Your compliance data will be preserved. You can resubscribe anytime from Settings → Billing to restore full access and resume monitoring.</p>
      <p>If this was a mistake, contact <a href="mailto:care@consentz.com" style="color: #0d9488;">care@consentz.com</a>.</p>
    `,
  });
}
