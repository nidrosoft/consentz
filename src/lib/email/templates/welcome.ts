import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface WelcomeEmailData {
  userName: string;
  organizationName: string;
  serviceType: string;
}

export function welcomeEmail(data: WelcomeEmailData): string {
  return baseLayout({
    preheader: `Your CQC compliance dashboard is ready, ${data.userName}.`,
    body: `
      <h1>Welcome to CQC Compliance, ${data.userName}!</h1>
      <p>Your account for <strong>${data.organizationName}</strong> has been created. You're now set up as a <strong>${data.serviceType}</strong> in the CQC Compliance Module.</p>
      <p>Here's how to get started:</p>
      <div class="card">
        <div class="list-item"><strong>Step 1:</strong> Complete your initial CQC assessment<br><span class="muted">Takes about 10 minutes. This creates your baseline compliance score.</span></div>
        <div class="list-item"><strong>Step 2:</strong> Link your Consentz account<br><span class="muted">Go to Settings → Integrations to connect your clinic data.</span></div>
        <div class="list-item"><strong>Step 3:</strong> Review your compliance gaps<br><span class="muted">Your dashboard will show priority areas to address.</span></div>
      </div>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">Go to Your Dashboard →</a></p>
      <p class="muted" style="text-align: center;">If you have questions, the AI compliance assistant is available inside your dashboard 24/7.</p>
    `,
  });
}
