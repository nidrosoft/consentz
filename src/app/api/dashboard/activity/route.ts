import { withAuth } from '@/lib/api-handler';
import { apiSuccess } from '@/lib/api-response';
import { parsePagination } from '@/lib/pagination';
import { getDb } from '@/lib/db';

export const GET = withAuth(async (req, { params, auth }) => {
  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);
  const client = await getDb();

  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;

  let query = client.from('activity_logs')
    .select('*', { count: 'exact' })
    .eq('organization_id', auth.organizationId);

  if (pagination.search) {
    const pattern = `%${pagination.search}%`;
    query = query.or(`description.ilike.${pattern},action.ilike.${pattern},actor_name.ilike.${pattern}`);
  }

  const { data: items, count: total } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalCount = total ?? 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);

  const data = (items ?? []).map((entry) => ({
    id: entry.id,
    action: entry.action,
    description: entry.description,
    user: entry.actor_name,
    createdAt: entry.created_at,
    entityType: entry.entity_type,
  }));

  return apiSuccess(data, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: totalCount,
    totalPages,
    hasMore: pagination.page < totalPages,
  });
});
