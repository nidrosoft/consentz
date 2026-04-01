import { baseLayout } from './base-layout';

interface TeamInvitationData {
  invitedName: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteLink: string;
}

export function teamInvitationEmail(data: TeamInvitationData): string {
  return baseLayout({
    preheader: `${data.inviterName} invited you to manage CQC compliance for ${data.organizationName}.`,
    body: `
      <h1>You've been invited!</h1>
      <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on the CQC Compliance Module as a <span class="badge badge-info">${data.role}</span>.</p>
      <p>The CQC Compliance Module helps your organisation track and improve compliance across all five CQC domains — Safe, Effective, Caring, Responsive, and Well-Led.</p>
      <p style="text-align: center; margin: 28px 0;"><a href="${data.inviteLink}" class="btn">Accept Invitation →</a></p>
      <p class="muted" style="text-align: center;">This invitation link expires in 7 days. If you didn't expect this invite, you can safely ignore this email.</p>
    `,
  });
}
