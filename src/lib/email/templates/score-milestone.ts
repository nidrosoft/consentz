import { baseLayout } from './base-layout';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.consentz.com';

interface ScoreMilestoneData {
  userName: string;
  previousRating: string;
  newRating: string;
  overallScore: number;
  previousScore: number;
}

export function scoreMilestoneEmail(data: ScoreMilestoneData): string {
  return baseLayout({
    preheader: `Your predicted CQC rating just moved from ${data.previousRating} to ${data.newRating}!`,
    body: `
      <h1 style="text-align: center;">🎉 Rating Milestone!</h1>
      <p style="text-align: center; font-size: 17px;">Your predicted CQC rating has improved.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span class="badge badge-warning" style="font-size: 16px; padding: 8px 16px;">${data.previousRating.replace('_', ' ')}</span>
        <span style="display: inline-block; margin: 0 12px; color: #71717a; font-size: 20px;">→</span>
        <span class="badge badge-good" style="font-size: 16px; padding: 8px 16px;">${data.newRating.replace('_', ' ')}</span>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <div class="metric-box" style="display: inline-block; padding: 20px 40px;">
          <p class="metric-value">${data.overallScore}%</p>
          <p class="metric-label">Current Score (was ${data.previousScore}%)</p>
        </div>
      </div>
      <p>This is a direct result of your team's work — uploading evidence, completing tasks, closing gaps, and keeping your Consentz data up to date.</p>
      <p><strong>Keep going.</strong> Every gap you close moves you closer to demonstrating excellence to CQC inspectors.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${APP_URL}/dashboard" class="btn">View Your Progress →</a></p>
    `,
  });
}
