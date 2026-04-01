import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface IncidentInvestigationData {
  recipientName: string;
  incidentTitle: string;
  severity: string;
  daysOpen: number;
  incidentId: string;
}

export function incidentInvestigationEmail(data: IncidentInvestigationData): string {
  return baseLayout({
    preheader: `Incident "${data.incidentTitle}" has been open for ${data.daysOpen} days without investigation.`,
    body: `
      <h1>Incident Investigation Reminder</h1>
      <p>${data.recipientName}, the following incident has been open for <strong>${data.daysOpen} days</strong> without being investigated:</p>
      <div class="card">
        <div class="card-row"><span class="card-label">Incident</span><span class="card-value">${data.incidentTitle}</span></div>
        <div class="card-row"><span class="card-label">Severity</span><span class="card-value">${data.severity}</span></div>
        <div class="card-row"><span class="card-label">Days open</span><span class="card-value" style="color: #dc2626;">${data.daysOpen} days</span></div>
      </div>
      <p>CQC inspectors specifically check that incidents are investigated promptly and that lessons are documented. Uninvestigated incidents are a common finding under KLOE S6 and Regulation 17.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/incidents/${data.incidentId}" class="btn">Investigate Now →</a></p>
    `,
  });
}
