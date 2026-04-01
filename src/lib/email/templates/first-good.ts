import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface FirstGoodData {
  userName: string;
  overallScore: number;
  daysToGetHere: number;
}

export function firstGoodEmail(data: FirstGoodData): string {
  return baseLayout({
    preheader: `Your clinic is now predicted to receive a "Good" CQC rating. Congratulations!`,
    body: `
      <h1 style="text-align: center;">🏆 Congratulations!</h1>
      <p style="text-align: center; font-size: 17px; color: #3f3f46;">Your predicted CQC rating just reached</p>
      <div style="text-align: center; margin: 24px 0;"><span class="badge badge-good" style="font-size: 24px; padding: 12px 32px;">GOOD</span></div>
      <div style="text-align: center; margin: 16px 0;">
        <div class="metric-box" style="display: inline-block; padding: 20px 40px;">
          <p class="metric-value">${data.overallScore}%</p>
          <p class="metric-label">Compliance Score</p>
        </div>
      </div>
      <p>${data.userName}, this is a significant milestone. It means your clinic now has sufficient evidence, policies, and operational compliance to likely receive a "Good" rating from CQC.</p>
      ${data.daysToGetHere > 0 ? `<p class="muted" style="text-align: center;">You reached this in ${data.daysToGetHere} days from your first assessment.</p>` : ''}
      <hr class="divider">
      <p><strong>What's next?</strong> "Good" is a strong position, but "Outstanding" (88%+) is achievable with continued effort.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">See What's Next →</a></p>
    `,
  });
}
