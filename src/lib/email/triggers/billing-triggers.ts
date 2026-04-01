import { sendEmail } from '../send';
import { subscriptionActivatedEmail } from '../templates/subscription-activated';
import { subscriptionCancelledEmail } from '../templates/subscription-cancelled';
import { getDb } from '@/lib/db';

export async function handleSubscriptionActivated(organizationId: string, planName: string, amount: string, nextBillingDate: string) {
  const db = await getDb();

  const { data: admins } = await db
    .from('users')
    .select('id, name, email')
    .eq('organization_id', organizationId)
    .in('role', ['OWNER', 'ADMIN']);

  if (!admins?.length) return;

  for (const admin of admins) {
    const html = subscriptionActivatedEmail({
      userName: admin.name || 'there',
      planName,
      amount,
      nextBillingDate,
    });

    await sendEmail(
      { to: admin.email, subject: 'Your CQC Compliance Subscription Is Active', html },
      { organizationId, userId: admin.id, emailType: 'subscription_activated' },
    );
  }
}

export async function handleSubscriptionCancelled(organizationId: string, accessUntil: string) {
  const db = await getDb();

  const { data: admins } = await db
    .from('users')
    .select('id, name, email')
    .eq('organization_id', organizationId)
    .in('role', ['OWNER', 'ADMIN']);

  if (!admins?.length) return;

  for (const admin of admins) {
    const html = subscriptionCancelledEmail({
      userName: admin.name || 'there',
      accessUntil,
    });

    await sendEmail(
      { to: admin.email, subject: 'Your CQC Compliance Subscription Has Been Cancelled', html },
      { organizationId, userId: admin.id, emailType: 'subscription_cancelled' },
    );
  }
}
