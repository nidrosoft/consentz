import { sendEmail } from '../send';
import { welcomeEmail } from '../templates/welcome';
import { getDb } from '@/lib/db';

export async function handleUserCreated(userId: string, email: string) {
  const db = await getDb();

  const { data: user } = await db
    .from('users')
    .select('name, organization_id')
    .eq('id', userId)
    .single();

  if (!user?.organization_id) return;

  const { data: org } = await db
    .from('organizations')
    .select('name, service_type')
    .eq('id', user.organization_id)
    .single();

  const html = welcomeEmail({
    userName: user.name || 'there',
    organizationName: org?.name || 'your organization',
    serviceType: org?.service_type === 'CARE_HOME' ? 'Care Home' : 'Aesthetic Clinic',
  });

  await sendEmail(
    { to: email, subject: 'Welcome to CQC Compliance by Consentz', html },
    { organizationId: user.organization_id, userId, emailType: 'welcome' },
  );
}
