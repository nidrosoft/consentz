import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface IncidentReportedData {
  recipientName: string;
  incidentTitle: string;
  severity: string;
  incidentType: string;
  reportedBy: string;
  reportedAt: string;
  incidentId: string;
  isReporter: boolean;
}

export function incidentReportedEmail(data: IncidentReportedData): string {
  const severityClass = data.severity === 'CRITICAL' ? 'badge-critical' : data.severity === 'HIGH' ? 'badge-warning' : 'badge-info';

  return baseLayout({
    preheader: `${data.isReporter ? 'Your incident report has been logged' : 'A new incident has been reported at your organisation'}.`,
    body: `
      <h1>${data.isReporter ? 'Incident Report Confirmed' : 'New Incident Reported'}</h1>
      <p>${data.isReporter 
        ? `${data.recipientName}, your incident report has been logged successfully.` 
        : `${data.recipientName}, a new incident has been reported at your organisation by ${data.reportedBy}.`}</p>
      <div class="card">
        <div class="card-row"><span class="card-label">Incident</span><span class="card-value">${data.incidentTitle}</span></div>
        <div class="card-row"><span class="card-label">Severity</span><span class="badge ${severityClass}">${data.severity}</span></div>
        <div class="card-row"><span class="card-label">Type</span><span class="card-value">${data.incidentType}</span></div>
        <div class="card-row"><span class="card-label">Reported by</span><span class="card-value">${data.reportedBy}</span></div>
        <div class="card-row"><span class="card-label">Date/time</span><span class="card-value">${data.reportedAt}</span></div>
      </div>
      <p><strong>Next step:</strong> This incident needs investigation. CQC requires evidence that incidents are investigated and that learning is applied (KLOE S6, Regulation 17).</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/incidents/${data.incidentId}" class="btn">View Incident →</a></p>
    `,
  });
}
