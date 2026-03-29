import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || "Consentz <noreply@consentz.com>";

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[Email] Resend not configured — skipping email send");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      console.error("[Email] Send failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (e) {
    console.error("[Email] Exception:", e);
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function sendInvitationEmail(params: {
  to: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}): Promise<{ success: boolean }> {
  return sendEmail({
    to: params.to,
    subject: `You've been invited to ${params.organizationName} on Consentz`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #111827;">You're invited to join ${params.organizationName}</h2>
        <p style="color: #4B5563;">${params.inviterName} has invited you to join as <strong>${params.role}</strong> on Consentz CQC Compliance.</p>
        <a href="${params.inviteUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Accept Invitation</a>
        <p style="color: #9CA3AF; font-size: 14px;">If you didn't expect this, you can ignore this email.</p>
      </div>
    `,
    text: `${params.inviterName} invited you to ${params.organizationName} on Consentz. Accept: ${params.inviteUrl}`,
  });
}

export async function sendNotificationDigest(params: {
  to: string;
  userName: string;
  organizationName: string;
  notifications: Array<{ title: string; message: string; createdAt: string }>;
}): Promise<{ success: boolean }> {
  const items = params.notifications
    .map((n) => `<li style="margin-bottom: 8px;"><strong>${n.title}</strong><br/><span style="color: #6B7280;">${n.message}</span></li>`)
    .join("");

  return sendEmail({
    to: params.to,
    subject: `Your Consentz compliance digest — ${params.notifications.length} updates`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #111827;">Hi ${params.userName},</h2>
        <p style="color: #4B5563;">Here's your compliance update for ${params.organizationName}:</p>
        <ul style="color: #374151; padding-left: 20px;">${items}</ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.consentz.com"}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Open Dashboard</a>
      </div>
    `,
  });
}
