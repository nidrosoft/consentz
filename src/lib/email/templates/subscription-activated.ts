import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

export function subscriptionActivatedEmail(data: { userName: string; planName: string; amount: string; nextBillingDate: string }): string {
  return baseLayout({
    preheader: `Your ${data.planName} subscription is now active.`,
    body: `
      <h1>Subscription Confirmed</h1>
      <p>${data.userName}, your CQC Compliance subscription is now active.</p>
      <div class="card">
        <div class="card-row"><span class="card-label">Plan</span><span class="card-value">${data.planName}</span></div>
        <div class="card-row"><span class="card-label">Amount</span><span class="card-value">${data.amount}/month</span></div>
        <div class="card-row"><span class="card-label">Next billing date</span><span class="card-value">${data.nextBillingDate}</span></div>
      </div>
      <p>All features are now unlocked: full CQC domain monitoring, AI policy generation, AI compliance assistant, Consentz integration, SDK access, and more.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">Go to Dashboard →</a></p>
    `,
  });
}
