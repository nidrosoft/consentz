import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface ScoreDroppedData {
  userName: string;
  previousScore: number;
  newScore: number;
  dropAmount: number;
  predictedRating: string;
  likelyCauses: string[];
}

export function scoreDroppedEmail(data: ScoreDroppedData): string {
  const causesList = data.likelyCauses.map(c => `<div class="list-item"><span class="severity-dot dot-high"></span>${c}</div>`).join('');

  return baseLayout({
    preheader: `Your compliance score dropped ${data.dropAmount} points to ${data.newScore}%. Immediate review recommended.`,
    body: `
      <h1>⚠️ Compliance Score Drop Detected</h1>
      <p>${data.userName}, your compliance score has dropped significantly after the latest Consentz data sync.</p>
      <div style="text-align: center; margin: 24px 0;">
        <div class="metric-box" style="display: inline-block; padding: 20px 40px; border: 2px solid #fbbf24;">
          <p class="metric-value" style="color: #dc2626;">${data.previousScore}% → ${data.newScore}%</p>
          <p class="metric-label">Down ${data.dropAmount} points</p>
        </div>
      </div>
      ${data.likelyCauses.length > 0 ? `<h2>Likely Causes</h2><div class="card">${causesList}</div>` : ''}
      <p>A drop this size typically means something in your clinic operations needs attention — expired credentials, lapsed consents, or new incidents that haven't been addressed.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">Review Your Dashboard →</a></p>
    `,
  });
}
