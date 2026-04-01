import { resend, FROM_EMAIL } from './resend';
import { getDb } from '@/lib/db';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(params: SendEmailParams, context?: {
  organizationId?: string;
  userId?: string;
  emailType: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      tags: params.tags,
    });

    if (error) {
      console.error(`[EMAIL] Failed to send ${context?.emailType}:`, error);
      return { success: false, error };
    }

    if (context?.organizationId) {
      try {
        const db = await getDb();
        await db.from('activity_logs').insert({
          organization_id: context.organizationId,
          user_id: context.userId || 'system',
          action: 'EMAIL_SENT',
          resource_type: 'email',
          details: {
            emailType: context.emailType,
            to: params.to,
            subject: params.subject,
            resendId: data?.id,
          },
        });
      } catch {
        // Don't fail email sends if logging fails
      }
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[EMAIL] Exception sending ${context?.emailType}:`, message);
    return { success: false, error: message };
  }
}
