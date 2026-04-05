import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (_req, { auth }) => {
  const client = await getDb();

  const { data } = await client
    .from('consentz_sync_logs')
    .select('synced_at')
    .eq('organization_id', auth.organizationId)
    .eq('status', 'success')
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return apiSuccess({ synced_at: data?.synced_at ?? null });
});
