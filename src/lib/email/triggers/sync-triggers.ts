import { sendEmail } from '../send';
import { syncFailedEmail } from '../templates/sync-failed';
import { syncCriticalIssuesEmail } from '../templates/sync-critical-issues';
import { getDb } from '@/lib/db';

export async function handleSyncFailed(organizationId: string, errorMessage: string) {
  const db = await getDb();

  const { data: admins } = await db
    .from('users')
    .select('id, name, email')
    .eq('organization_id', organizationId)
    .in('role', ['OWNER', 'ADMIN']);

  if (!admins?.length) return;

  const { data: lastSync } = await db
    .from('consentz_sync_logs')
    .select('synced_at')
    .eq('organization_id', organizationId)
    .eq('status', 'SUCCESS')
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSuccessfulSync = lastSync?.synced_at
    ? new Date(lastSync.synced_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never';

  for (const admin of admins) {
    await sendEmail(
      {
        to: admin.email,
        subject: '⚠️ Consentz Sync Failed — Action May Be Required',
        html: syncFailedEmail({ userName: admin.name || 'there', errorMessage, lastSuccessfulSync }),
      },
      { organizationId, userId: admin.id, emailType: 'sync_failed' },
    );
  }
}

export async function handleSyncCriticalIssues(organizationId: string, issues: { title: string; domain: string }[]) {
  if (!issues.length) return;

  const db = await getDb();
  const { data: admins } = await db
    .from('users')
    .select('id, name, email')
    .eq('organization_id', organizationId)
    .in('role', ['OWNER', 'ADMIN']);

  if (!admins?.length) return;

  const syncTime = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  for (const admin of admins) {
    await sendEmail(
      {
        to: admin.email,
        subject: '🔴 Critical Compliance Issues Detected in Latest Sync',
        html: syncCriticalIssuesEmail({ userName: admin.name || 'there', issues, syncTime }),
      },
      { organizationId, userId: admin.id, emailType: 'sync_critical_issues' },
    );
  }
}
