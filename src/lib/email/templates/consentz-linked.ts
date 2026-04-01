import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface ConsentzLinkedData {
  userName: string;
  clinicName: string;
  endpointsSucceeded: number;
  endpointsFailed: number;
  nextSyncTime: string;
}

export function consentzLinkedEmail(data: ConsentzLinkedData): string {
  return baseLayout({
    preheader: `Your Consentz clinic "${data.clinicName}" is now connected.`,
    body: `
      <h1>Consentz Connected Successfully</h1>
      <p>Great news, ${data.userName}. Your Consentz clinic <strong>"${data.clinicName}"</strong> is now linked to the CQC Compliance Module.</p>
      <div class="card">
        <div class="card-row"><span class="card-label">Status</span><span class="card-value" style="color: #16a34a;">✓ Connected</span></div>
        <div class="card-row"><span class="card-label">Data feeds active</span><span class="card-value">${data.endpointsSucceeded} of 8</span></div>
        ${data.endpointsFailed > 0 ? `<div class="card-row"><span class="card-label">Feeds unavailable</span><span class="card-value" style="color: #f97316;">${data.endpointsFailed}</span></div>` : ''}
        <div class="card-row"><span class="card-label">Next automatic sync</span><span class="card-value">${data.nextSyncTime}</span></div>
      </div>
      <h2>What This Means</h2>
      <p>Your compliance score will now update automatically every 6 hours using live data from your Consentz clinic:</p>
      <p style="padding-left: 16px; border-left: 3px solid #0d9488;">Staff qualifications · Consent completion · Consent expiry · Infection incidents · Policy sign-offs · Safety checklists · Treatment risk data · Patient feedback</p>
      <p>You no longer need to manually track most of this — the system does it for you.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">View Updated Dashboard →</a></p>
    `,
  });
}
